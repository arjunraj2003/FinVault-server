import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { AppDataSource } from "../config/data-source";
import { webAuthnSettings } from "../config/webauthn";
import { WebAuthnCredential } from "../entity/webauthn-credential.entity";
import { User } from "../entity/user.entity";
import { ApiError } from "../utils/apiError";

const credentialRepo = () => AppDataSource.getRepository(WebAuthnCredential);

export class WebAuthnService {
    static async registrationOptions(user: User, requestOrigin?: string) {
        const { rpID, rpName } = webAuthnSettings(requestOrigin);
        const existing = await credentialRepo().find({ where: { userId: user.id } });

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: user.email,
            userDisplayName: user.name,
            userID: isoUint8Array.fromUTF8String(user.id),
            attestationType: "none",
            excludeCredentials: existing.map((credential) => ({
                id: credential.credentialId,
                transports: credential.transports,
            })),
            authenticatorSelection: {
                residentKey: "required",
                userVerification: "required",
                authenticatorAttachment: "platform",
            },
            preferredAuthenticatorType: "localDevice",
        });

        return options;
    }

    static async verifyRegistration(
        user: User,
        response: RegistrationResponseJSON,
        expectedChallenge: string,
        requestOrigin?: string
    ) {
        const { origins, expectedRPIDs } = webAuthnSettings(requestOrigin);
        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origins,
                expectedRPID: expectedRPIDs,
                requireUserVerification: true,
            });
        } catch (error) {
            throw new ApiError((error as Error).message || "Fingerprint setup failed", 400);
        }

        if (!verification.verified || !verification.registrationInfo) {
            throw new ApiError("Fingerprint setup failed", 400);
        }

        const { credential } = verification.registrationInfo;
        const saved = credentialRepo().create({
            credentialId: credential.id,
            publicKey: isoBase64URL.fromBuffer(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports,
            label: "This phone",
            user,
            userId: user.id,
        });
        await credentialRepo().save(saved);
        return { credentialId: saved.credentialId };
    }

    static async loginOptions(credentialId: string | undefined, requestOrigin?: string) {
        const { rpID } = webAuthnSettings(requestOrigin);
        return generateAuthenticationOptions({
            rpID,
            userVerification: "required",
            allowCredentials: credentialId ? [{ id: credentialId }] : undefined,
        });
    }

    static async verifyLogin(
        response: AuthenticationResponseJSON,
        expectedChallenge: string,
        requestOrigin?: string
    ) {
        const { origins, expectedRPIDs } = webAuthnSettings(requestOrigin);
        const stored = await credentialRepo().findOne({
            where: { credentialId: response.id },
            relations: ["user"],
        });
        if (!stored?.user) throw new ApiError("Fingerprint is not registered on this phone", 401);

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origins,
                expectedRPID: expectedRPIDs,
                requireUserVerification: true,
                credential: {
                    id: stored.credentialId,
                    publicKey: isoBase64URL.toBuffer(stored.publicKey),
                    counter: stored.counter,
                    transports: stored.transports,
                },
            });
        } catch (error) {
            throw new ApiError((error as Error).message || "Fingerprint unlock failed", 401);
        }

        if (!verification.verified) {
            throw new ApiError("Fingerprint unlock failed", 401);
        }

        stored.counter = verification.authenticationInfo.newCounter;
        await credentialRepo().save(stored);
        return stored.user;
    }

    static async remove(userId: string, credentialId: string) {
        await credentialRepo().delete({ userId, credentialId });
    }
}
