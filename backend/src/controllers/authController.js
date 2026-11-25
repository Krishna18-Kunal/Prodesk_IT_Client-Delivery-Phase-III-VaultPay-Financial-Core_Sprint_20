import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../config/db.js';
import { AppError } from '../utils/errors.js';
const schema=z.object({email:z.string().email(),password:z.string().min(8)});
export async function login(req,res,next){try{
 const input=schema.parse(req.body); const user=db.prepare('SELECT * FROM users WHERE email=?').get(input.email.toLowerCase());
 if(!user||!(await bcrypt.compare(input.password,user.password_hash))) throw new AppError('Invalid email or password',401);
 const token=jwt.sign({},process.env.JWT_SECRET,{subject:user.id,expiresIn:process.env.JWT_EXPIRES_IN||'1d'});
 res.json({success:true,token,user:{id:user.id,name:user.name,email:user.email,role:user.role,company:user.company}});
 }catch(e){next(e);}}
export function me(req,res){res.json({success:true,user:req.user});}
export async function createClient(req,res,next){try{
 const s=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8),company:z.string().optional()}).parse(req.body);
 const id=randomUUID(),hash=await bcrypt.hash(s.password,12);
 db.prepare('INSERT INTO users(id,name,email,password_hash,role,company) VALUES(?,?,?,?,?,?)').run(id,s.name,s.email.toLowerCase(),hash,'Client',s.company||null);
 res.status(201).json({success:true,user:{id,name:s.name,email:s.email,role:'Client',company:s.company||null}});
 }catch(e){next(e.code==='SQLITE_CONSTRAINT_UNIQUE'?new AppError('Email already exists',409):e);}}
