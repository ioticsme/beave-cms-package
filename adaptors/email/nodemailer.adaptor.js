const nodemailer = require('nodemailer')
const { decryptData } = require('../../helper/Operations.helper')

const sendLocalMail = async (
    to,
    subject,
    template,
    payloads,
    local_settings,
    filePath = false,
    html = false
) => {
    const auth_password = await decryptData(local_settings.auth_password)
    // Step 1: Create a transporter
    const transporter = nodemailer.createTransport({
        host: local_settings.host, // Replace with your SMTP server address
        port: local_settings.port, // Common SMTP port (587 for STARTTLS)
        secure: local_settings.secure, // Set to true for port 465, false for other ports
        auth: {
            user: local_settings.auth_username, // Your SMTP username
            pass: auth_password, // Your SMTP password
        },
    })

    // Step 2: Set up email options
    const mailOptions = {
        from: local_settings.from, // Sender's address
        to: to, // List of recipients
        subject: subject, // Subject line
        text: 'Hello world!', // Plain text body
        html: '<b>Hello world!</b>', // HTML body
    }

    // Step 3: Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error occurred:', error)
        }
        console.log('Email sent:', info.response)
    })
}
