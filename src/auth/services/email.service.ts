// import * as nodemailer from 'nodemailer';

import { Injectable } from '@nestjs/common';
// import Mail from 'nodemailer/lib/mailer';

import { MailerService } from '@nestjs-modules/mailer';

// 메일 욥선 타입. 수신자(to), 메일 제목, html 형식의 메일 본문을 가짐
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  auth: {
    user: string;
    pass: string;
  };
}

@Injectable()
export class EmailService {
  // nodemailer에서 제공하는 Transporter 객체를 생성
  constructor(private readonly mailerService: MailerService) {}

  async sendMemberJoinVerification(
    emailAddress: string,
    twoFactorCode: string,
  ) {
    // 이 링크를 통해 우리 서비스로 이메일 인증 요청이 들어옴
    // const baseUrl = 'http://localhost:3001'; // TODO: config

    const url = `${process.env.FRONT_END_POINT}/auth/tfa-verification?twoFactorCode=${twoFactorCode}`;

    // 메일 본문 구성 form 태그를 이용해 POST 요청 실시
    console.log(process.env.GMAIL_ID, process.env.GMAIL_PW);
    const mailOptions: EmailOptions = {
      to: emailAddress,
      subject: 'ft_transcendence: 2FA',
      html: `
        인증 버튼을 누르면 인증이 완료됩니다.<br/>
        <a href="${url}">인증하기</a>
      `,
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PW,
      },
    };

    // transporter 객체를 이용해 메일 전송
    try {
      await this.mailerService.sendMail(mailOptions);
      return true;
    } catch (error) {
      return false;
    }
    // return await this.mailerService.sendMail(mailOptions);
  }
}
