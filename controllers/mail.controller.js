import { Resend } from 'resend';
import dotenv from "dotenv";



dotenv.config({quiet: true});



const RESEND_API = process.env.RESEND_API;


const resend = new Resend(RESEND_API);

export async function sendEmail({ to, subject, html }) {

    await resend.emails.send({
        from: "ne-pas-repondre@fmsb-thenightshift.sbs",
        to,
        subject,
        html,
    });
    
};