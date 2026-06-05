import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, DashboardOverview } from './models';

type DashboardOverviewResponse = ApiResponse<DashboardOverview> | DashboardOverview;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  overview(): Observable<DashboardOverview> {
    return this.http
      .get<DashboardOverviewResponse>(`${environment.apiUrl}/dashboard/overview`)
      .pipe(map((response) => ('data' in response ? response.data : response)));
  }
}
