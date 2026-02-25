import express, { Request, Response } from "express";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import morgan from "morgan";

const app = express();
const allowedOrigins=[
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:4173'
]
const corsOptions:CorsOptions={
  origin:(origin,callback)=>{
    if(!origin) return callback(null ,true);
    if(allowedOrigins.includes(origin)){
      callback(null,true);
    }else{
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE"],
};

app.use(cors(corsOptions));
app.use(morgan("dev"))
app.use(express.json());
app.use(cookieParser());
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express");
});

app.use('/api/v1/auth',authRoutes)
app.use('/api/v1/account',accountRoutes)
app.use('/api/v1/transaction',transactionRoutes)
app.use('/api/v1/dashboard',dashboardRoutes)
app.use(errorHandler);

export default app;
