import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../config/db.js';
import { AppError } from '../utils/errors.js';
import { createReceipt } from '../services/pdf.js';
import { sendReceiptEmail } from '../services/email.js';
const money=n=>({amount:n.amount_cents/100,currency:n.currency});
export function listInvoices(req,res){
 const rows=req.user.role==='Admin'?db.prepare(`SELECT i.*,u.name client_name,u.email client_email FROM invoices i JOIN users u ON u.id=i.client_id ORDER BY i.created_at DESC`).all():db.prepare('SELECT * FROM invoices WHERE client_id=? ORDER BY created_at DESC').all(req.user.id);
 res.json({success:true,invoices:rows.map(i=>({...i,...money(i)}))});
}
export function getInvoice(req,res,next){
 const i=db.prepare('SELECT i.*,u.name client_name,u.email client_email,u.company client_company FROM invoices i JOIN users u ON u.id=i.client_id WHERE i.id=?').get(req.params.id);
 if(!i) return next(new AppError('Invoice not found',404));
 if(req.user.role!=='Admin'&&i.client_id!==req.user.id) return next(new AppError('You do not have access to this invoice',403));
 res.json({success:true,invoice:{...i,...money(i)}});
}
export function createInvoice(req,res,next){try{
 const s=z.object({clientId:z.string().uuid(),title:z.string().min(3),description:z.string().optional(),amount:z.number().positive().max(1000000),dueDate:z.string().optional(),currency:z.string().length(3).default('inr')}).parse(req.body);
 const client=db.prepare("SELECT id FROM users WHERE id=? AND role='Client'").get(s.clientId); if(!client) throw new AppError('Client not found',404);
 const id=randomUUID(),number=`NXS-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
 db.prepare('INSERT INTO invoices(id,invoice_number,client_id,title,description,amount_cents,currency,due_date) VALUES(?,?,?,?,?,?,?,?)').run(id,number,s.clientId,s.title,s.description||'',Math.round(s.amount*100),s.currency.toLowerCase(),s.dueDate||null);
 res.status(201).json({success:true,invoice:db.prepare('SELECT * FROM invoices WHERE id=?').get(id)});
 }catch(e){next(e);}}
export function clients(req,res){const rows=db.prepare("SELECT id,name,email,company,created_at FROM users WHERE role='Client' ORDER BY name").all();res.json({success:true,clients:rows});}
export async function downloadInvoice(req,res,next){try{
 const i=db.prepare('SELECT i.*,u.name client_name,u.email client_email,u.company client_company FROM invoices i JOIN users u ON u.id=i.client_id WHERE i.id=?').get(req.params.id);
 if(!i) throw new AppError('Invoice not found',404);
 if(req.user.role!=='Admin'&&i.client_id!==req.user.id) throw new AppError('You do not have access to this invoice',403);
 if(i.status!=='Paid') throw new AppError('Receipt is available after payment is confirmed',409);
 const file=i.receipt_path||await createReceipt(i,{name:i.client_name,email:i.client_email,company:i.client_company});
 if(!i.receipt_path) db.prepare('UPDATE invoices SET receipt_path=? WHERE id=?').run(file,i.id);
 res.download(file,`${i.invoice_number}-receipt.pdf`);
 }catch(e){next(e);}}
