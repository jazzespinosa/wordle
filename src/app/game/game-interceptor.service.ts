// import {
//   HttpEvent,
//   HttpHandler,
//   HttpInterceptor,
//   HttpRequest,
// } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Environment } from '../../environment';

// export class GameInterceptorService implements HttpInterceptor {
//   private environment = new Environment();
//   private host = this.environment.getApiHost();
//   private key = this.environment.getApiKey();
//   private ua = this.environment.getApiUa();

//   intercept(
//     req: HttpRequest<any>,
//     next: HttpHandler
//   ): Observable<HttpEvent<any>> {
//     const newHeader = req.clone({
//       headers: req.headers
//         .set('x-rapidapi-host', this.host)
//         .set('x-rapidapi-key', this.key)
//         .set('x-rapidapi-ua', this.ua),
//     });

//     return next.handle(newHeader);
//   }
// }
