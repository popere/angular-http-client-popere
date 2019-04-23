import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap, map, concatMap, delay, catchError, retry, retryWhen } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  name = 'Angular 5';
  users = {};

  apiUrl = 'https://httpstat.us/401';

  private _numberRetryWhenOffline = 2;

  GetData() {
    this.http.get<any[]>(this.apiUrl)
      .pipe(
        retryWhen(this.retryStrategy.bind(this))
        //catchError(this.handleError)
      )
      .subscribe(data => {
        console.log('sucesss data', data);
        this.users = data;
      }, error => {
        console.log('gestion del error en subscribe', error);
      });
  }

  ClearData() {
    this.users = [];
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      console.log('Gestionar error 401');
      //TODO recuperar el token con el refresh y reintentar la llamada
      return of('0');


    } else {
      return throwError(error);
    }
    
  };

  private retryStrategy(error: Observable<any>) {
    return error.pipe(
      concatMap((error, count) => {
        console.log('count', count);
        console.log('error', error);
        if (count < 2 && (error.error instanceof ErrorEvent || error.error instanceof ProgressEvent)) {
            return of(error.status);
        } else {
          if (error.status === 401) {
            //TODO recuperar el token con el refresh y reintentar la llamada
            // debugger;
            let tokenUrl = 'https://httpstat.us/401';
            let postRefreshSubject = new BehaviorSubject<any>([]); 
            this.http.post(tokenUrl, {}).pipe(
              retry(2), //TODO es posible que haga falta hacerlo con un retryWhen
              delay(1000)
            ).subscribe(newTokenData => {

              //TODO mirar bien esto
              debugger;
              postRefreshSubject.next(newTokenData);
            }, errorToken => {
              //TODO mirar bien esto
              debugger;
              postRefreshSubject.error(errorToken)
            })

            return postRefreshSubject.asObservable();
          } else {
            return throwError(error);
          }
        }
      }),
      delay(1000)
    )
  }

  private refreshToken() {
    
  }

  private handleRetryError(error: HttpErrorResponse, count: number) {
    console.log('count', count);
    console.log('error', error);
    if (count < 2 && (error.error instanceof ErrorEvent || error.error instanceof ProgressEvent)) {
        return of(error.status);
    } else {
        return throwError(error);
    }

  };

  constructor(private http: HttpClient) { }
  ngOnInit() { }

}
