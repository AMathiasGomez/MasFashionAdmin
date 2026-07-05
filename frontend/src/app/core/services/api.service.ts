import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';

type QueryValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, query?: Record<string, QueryValue>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${API_BASE_URL}${path}`, { params: this.buildParams(query) })
      .pipe(map((response) => response.data));
  }

  download(path: string, query?: Record<string, QueryValue>): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}${path}`, {
      params: this.buildParams(query),
      responseType: 'blob'
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${API_BASE_URL}${path}`, body)
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${API_BASE_URL}${path}`, body)
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${API_BASE_URL}${path}`, body)
      .pipe(map((response) => response.data));
  }

  private buildParams(query?: Record<string, QueryValue>): HttpParams {
    let params = new HttpParams();

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
