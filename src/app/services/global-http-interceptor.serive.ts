import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class GlobalHttpInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('onrequest',req);
    
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle HTTP errors here
        console.error('HTTP Error:', error);

        // Optionally, you can rethrow the error or return a default value
        return throwError(error);
      })
    );
  }
}
