import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, DollarSign, Users, TrendingDown, Calendar, Loader2, UserCheck, AlertCircle } from "lucide-react";
import SarIcon from "@/components/sar-icon";
import { useTranslate } from "@/lib/useTranslate";
import { useTranslation } from "react-i18next";

interface PayrollEmployee {
  employeeId: string;
  name: string;
  role: string;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkingDays: number;
  deductions: number;
  lateDeductions: number;
  netSalary: number;
  attendanceRate: number;
}

interface PayrollReport {
  month: number;
  year: number;
  employees: PayrollEmployee[];
  totals: {
    totalBaseSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    employeeCount: number;
  };
}

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function PayrollManagementPage() {
  const tc = useTranslate();
  const { i18n } = useTranslation();
  const MONTHS = i18n.language === 'ar' ? MONTHS_AR : MONTHS_EN;
  const [, setLocation] = useLocation();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data, isLoading } = useQuery<PayrollReport>({
    queryKey: ["/api/payroll/report", month, year],
    queryFn: () => fetch(`/api/payroll/report?month=${month}&year=${year}`).then(r => r.json()),
  });

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setLocation("/manager/dashboard")} className="text-muted-foreground hover:text-foreground" data-testid="btn-back">
            <ArrowLeft className="w-4 h-4 ml-2" />{tc("العودة","Back")}
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-400" />{tc("تقرير الرواتب","Payroll Report")}
          </h1>
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-32 bg-background border-border" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24 bg-background border-border" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-400" /></div>
        ) : !data ? (
          <div className="text-center py-12 text-muted-foreground">{tc("لا توجد بيانات","No data available")}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">{tc("الموظفون","Employees")}</p>
                  <p className="text-2xl font-bold text-foreground">{data.totals.employeeCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">{tc("إجمالي الرواتب الأساسية","Total Base Salaries")}</p>
                  <p className="text-xl font-bold text-amber-400">{data.totals.totalBaseSalary.toLocaleString()} <SarIcon /></p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">{tc("إجمالي الخصومات","Total Deductions")}</p>
                  <p className="text-xl font-bold text-red-400">{data.totals.totalDeductions.toLocaleString()} <SarIcon /></p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">{tc("صافي الرواتب","Net Salaries")}</p>
                  <p className="text-xl font-bold text-green-400">{data.totals.totalNetSalary.toLocaleString()} <SarIcon /></p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{tc("تقرير","Report")} {MONTHS[data.month - 1]} {data.year}</span>
            </div>

            {data.employees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tc("لا يوجد موظفون مسجلون","No employees registered")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.employees.map((emp, idx) => (
                  <Card key={emp.employeeId} className="bg-card border-border" data-testid={`card-payroll-${idx}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                        <div>
                          <h3 className="text-white font-semibold">{emp.name}</h3>
                          <p className="text-muted-foreground text-xs">{emp.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-lg">{emp.netSalary.toLocaleString()} <SarIcon /></p>
                          <p className="text-muted-foreground text-xs">{tc("أساسي","Base")}: {emp.baseSalary.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                        <div className="bg-card/50 rounded-lg p-2">
                          <p className="text-green-400 font-bold">{emp.presentDays}</p>
                          <p className="text-muted-foreground text-xs">{tc("حضور","Present")}</p>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <p className="text-red-400 font-bold">{emp.absentDays}</p>
                          <p className="text-muted-foreground text-xs">{tc("غياب","Absent")}</p>
                        </div>
                        <div className="bg-card/50 rounded-lg p-2">
                          <p className="text-amber-400 font-bold">{emp.lateDays}</p>
                          <p className="text-muted-foreground text-xs">{tc("تأخير","Late")}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-xs">{tc("نسبة الحضور","Attendance Rate")}</span>
                        <span className={`text-sm font-medium ${emp.attendanceRate >= 90 ? 'text-green-400' : emp.attendanceRate >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                          {emp.attendanceRate}%
                        </span>
                      </div>
                      <Progress value={emp.attendanceRate} className="h-1.5 mb-2" />
                      {(emp.deductions > 0 || emp.lateDeductions > 0) && (
                        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 rounded-lg p-2 mt-2">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{tc("خصم غياب","Absence deduction")}: {emp.deductions} <SarIcon /> | {tc("خصم تأخير","Late deduction")}: {emp.lateDeductions} <SarIcon /></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
