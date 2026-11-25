import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db } from './config/db.js';
const users=[
 {name:'VaultPay Administrator',email:'admin@vaultpay.demo',password:'Admin@12345',role:'Admin',company:'Nexus Corporate Services'},
 {name:'Jordan Lee',email:'jordan@client.demo',password:'Client@12345',role:'Client',company:'Jordan Lee Consulting'},
 {name:'Taylor Morgan',email:'taylor@client.demo',password:'Client@12345',role:'Client',company:'Morgan Strategy Group'}
];
for(const u of users){const exists=db.prepare('SELECT id FROM users WHERE email=?').get(u.email);if(!exists)db.prepare('INSERT INTO users(id,name,email,password_hash,role,company) VALUES(?,?,?,?,?,?)').run(randomUUID(),u.name,u.email,await bcrypt.hash(u.password,12),u.role,u.company);}
const jordan=db.prepare('SELECT id FROM users WHERE email=?').get('jordan@client.demo');
if(!db.prepare('SELECT id FROM invoices LIMIT 1').get()){
 db.prepare('INSERT INTO invoices(id,invoice_number,client_id,title,description,amount_cents,currency,due_date) VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),'NXS-DEMO-1001',jordan.id,'Enterprise Consulting','Quarterly business transformation consulting',1250000,'usd','2026-12-15');
}
console.log('Demo data ready. Admin: admin@vaultpay.demo / Admin@12345 | Client: jordan@client.demo / Client@12345');
