import nodemailer from 'nodemailer';
export async function sendReceiptEmail({to,name,invoiceNumber,pdfPath}) {
 if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS) {
  console.warn('SMTP not configured; receipt email skipped. Configure SMTP_* in .env.'); return {sent:false,reason:'SMTP not configured'};
 }
 const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE)==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
 await transporter.sendMail({from:process.env.MAIL_FROM||process.env.SMTP_USER,to,subject:`Payment receipt – ${invoiceNumber}`,text:`Hello ${name},\n\nWe have received your payment for invoice ${invoiceNumber}. Your paid receipt is attached.\n\nThank you,\nNexus Corporate Services`,attachments:[{filename:`${invoiceNumber}-receipt.pdf`,path:pdfPath}]});
 return {sent:true};
}
