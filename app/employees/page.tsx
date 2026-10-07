'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UserCheck, Phone, Calendar } from 'lucide-react';

interface Employee {
  employeeId: string;
  name: string;
  role: string;
  phone: string;
  monthlySalary: number;
  joiningDate: string;
  isActive: boolean;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(d.data);
      })
      .catch(() => {});
  }, []);

  return (
    <PageContainer
      title="Employee & Labour Management"
      subtitle="Staff directory, attendance records, monthly salaries, and event labor assignments"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <Card key={emp.employeeId} glass className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-brand-400" />
                <h3 className="font-bold text-white text-sm">{emp.name}</h3>
              </div>
              <Badge variant={emp.isActive ? 'success' : 'neutral'}>{emp.role}</Badge>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300"><Phone className="h-3 w-3" /><span>{emp.phone}</span></div>
              <div className="flex items-center gap-1.5 text-slate-400"><Calendar className="h-3 w-3" /><span>Joined: {new Date(emp.joiningDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-900 font-bold">
                <span>Monthly Salary:</span>
                <span className="text-amber-400">PKR {emp.monthlySalary.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
