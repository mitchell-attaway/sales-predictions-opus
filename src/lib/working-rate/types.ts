export interface Partner {
  id: string;
  name: string;
  monthlyInvoice: number;
  isActive: boolean;
  marketingDirector: string;
  harvestClientId?: number;
}

export interface TimeEntry {
  id: number;
  hours: number;
  date: string;
  clientId: number;
  clientName: string;
  userId: number;
  userName: string;
  projectName: string;
  taskName: string;
}

export interface WorkingRateData {
  partnerId: string;
  partnerName: string;
  monthlyInvoice: number;
  totalHours: number;
  workingRate: number;
  marketingDirector: string;
  periodStart: string;
  periodEnd: string;
}

export interface MarketingDirectorSummary {
  name: string;
  clients: WorkingRateData[];
  totalInvoiceValue: number;
  totalHours: number;
  averageWorkingRate: number;
  clientCount: number;
}

export interface WorkingRatesResponse {
  period: { from: string; to: string; months: number };
  partners: WorkingRateData[];
  directors: MarketingDirectorSummary[];
  totals: {
    totalPartners: number;
    totalInvoiceValue: number;
    totalHours: number;
    overallWorkingRate: number;
  };
}

export interface HarvestClient {
  id: number;
  name: string;
  is_active: boolean;
}

export interface HarvestUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

export interface HarvestTimeEntry {
  id: number;
  hours: number;
  spent_date: string;
  client: { id: number; name: string };
  user: { id: number; name: string };
  project: { id: number; name: string };
  task: { id: number; name: string };
}
