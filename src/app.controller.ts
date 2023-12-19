import { Controller, Get, Render, Res, Post, Body } from '@nestjs/common';
import * as mysql from 'mysql2';
import { AppService } from './app.service';
import { NewCouponDTO } from './newCouponDTO';
import { Response } from 'express';

const conn = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user:  'root',
  password: '',
  database: 'coupons',
}).promise();

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  async index() {
    const [data] = await conn.execute('SELECT title, percentage, code FROM kuponok ORDER BY title');
    return { title: 'Kezdőoldal', index: data };
  }

  @Get('/newCoupon')
  @Render('newCoupon')
  form() {
    return { title: 'Kupon felvétele', errors: [] };
  }

  @Post('/newCoupon')
  @Render('newCoupon')
  async newcouponPost(@Body() newCoupon: NewCouponDTO, @Res() res: Response) {
    const errors: string[] = [];
    const regexForCode = /^[A-Z]{4}-\d{6}$/;
    if (newCoupon.title.trim() === '') {
      errors.push('Az előadás címe legalább 1 karakter kell hogy legyen!');
    }

    if (newCoupon.percentage === undefined) {
      errors.push('Adja meg a kupon százalékát!');
    } else if (newCoupon.percentage < 1 || newCoupon.percentage > 99) {
      errors.push('A kupon százaléka csak 1 és 99 közötti szám lehet!');
    }

    if (newCoupon.code.trim() === '') {
      errors.push('Adja meg a kupon kódját!');
    } else if (regexForCode.test(newCoupon.code) === false) {
      errors.push('A kupon kódjának a formátuma a következő kell hogy legyen: (BBBB-SSSSSS) (4 angol ABC nagybetű, kötőjel, 6 számjegy). Pl. "SKPR-122558"');
    }

    if (errors.length > 0) {
      res.render('newCoupon', { title: 'Kupon felvétele', errors });
    } else {
      const title: string = newCoupon.title;
      const percentage: number = newCoupon.percentage;
      const code: string = newCoupon.code;
      const [data] = await conn.execute('INSERT INTO kuponok (title, percentage, code) VALUES (?, ?, ?)', [title, percentage, code]);
      res.redirect('/');
    }
  }
}
