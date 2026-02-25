import jwt from 'jsonwebtoken'
import { ApiError } from './apiError'


const JWT_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET



// ----------  ACCESS TOKEN  ----------

export const generateAccessToken = (payload: Object) => {
    try {

        return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
    } catch (error) {
        console.log(error);

    }
}

export const verifyAccessToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        throw new ApiError("Invalid or expired access token", 401)
    }
}


export const generateRefreshToken = (payload: Object) => {

    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export const verifyRefreshToken = (token: string) => {
    try {
        return jwt.verify(token, REFRESH_SECRET)
    } catch (error) {
        throw new ApiError("Invalid or expired access token", 401)
    }
}



export const generatePassordResetToken = (payload: Object, secret: string) => {

    return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export const verifyPassordResetToken = (token: string, secret: string) => {
    try {
        return jwt.verify(token, secret)
    } catch (error) {
        throw new ApiError("Invalid or expired access token", 401)
    }
}