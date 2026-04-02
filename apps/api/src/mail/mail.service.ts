import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM'),
      to,
      subject: 'Welcome to Golf Charity Platform! ⛳',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E7D32;">Welcome, ${name}!</h2>
          <p>Thank you for joining the Golf Charity Platform.</p>
          <p>Your journey to improve your golf score while making a difference in the world starts here.</p>
          <br/>
          <p>You can now subscribe to a plan, participate in monthly draws, and support your favorite charities!</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The Golf Charity Team</strong></p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${to}: ${error.message}`);
      // We don't throw the error so user registration doesn't completely fail if email fails
    }
  }

  async sendWinnerNotification(to: string, month: string, amount: number) {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM'),
      to,
      subject: '🎉 Congratulations! You won the Draw! ⛳',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E7D32;">Congratulations!</h2>
          <p>You are a winner in the <strong>${month}</strong> draw!</p>
          <p>Your estimated prize pool share is: <strong>₹${amount}</strong></p>
          <br/>
          <p>Please log in to your dashboard to upload your winning proof and claim your prize.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The Golf Charity Team</strong></p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Winner email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Error sending winner email: ${error.message}`);
    }
  }
}
