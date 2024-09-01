import { Body, Controller, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import { UserService } from './services/user.service';
import * as crypto from 'crypto';


@Controller('user')
export class userController {
    constructor(
        private readonly userService: UserService
    ){}

    @Post('webhook')
    async webhook(
      @Headers('webhook-signature') signature: string,
      @Headers('webhook-timestamp') timestamp: string,
      @Headers('webhook-id') webhookId: string,
      @Body() body: any,
    ) {
      const secret = 'wsec_WJStlX/jEqv9bLVpYPXQZcXZeDsdRIDb'; //just for test
      
      const requestBody = JSON.stringify(body);
  
      const isValid = this.verifySignature(secret, signature, webhookId, timestamp, requestBody);
  
      if (!isValid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
  
      console.log('Webhook received and verified:', body);
  
      return { success: true };
    }

    verifySignature(secret: string, signature: string, webhookId: string, timestamp: string, requestBody: string): boolean {
        try {
          // Step 2: Prepare the secret string
          const cleanedSecret = secret.replace('wsec_', '');
          const tempSecret = Buffer.from(cleanedSecret, 'base64');
    
          // Step 3: Prepare the signed_payload string
          const signedPayload = `${webhookId}.${timestamp}.${requestBody}`;
    
          // Step 4: Determine the expected signature
          const hmac = crypto.createHmac('sha256', tempSecret);
          hmac.update(signedPayload, 'utf8');
          const expectedSignature = hmac.digest('base64');
    
          // Step 5: Compare the signatures
          return signature === expectedSignature;
        } catch (error) {
          throw new UnauthorizedException('Invalid signature');
        }
      }
}
