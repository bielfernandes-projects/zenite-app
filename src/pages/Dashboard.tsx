import { Users, GraduationCap, Sun, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { students, enrollmentsByMonth, grades } from "@/data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function Dashboard() {
  const activeStudents = students.filter((s) => s.status === "Ativo").length;
  const morningCount = students.filter((s) => s.shift === "Manhã").length;
  const afternoonCount = students.filter((s) => s.shift === "Tarde").length;

  const gradeDistribution = grades.map((grade) => ({
    grade,
    count: students.filter((s) => s.grade === grade).length,
  }));

  const totalEnrollments = enrollmentsByMonth.reduce((sum, month) => sum + month.count, 0);
  const avgEnrollments = Math.round(totalEnrollments / enrollmentsByMonth.length);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão escolar
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Students Card */}
        <Card className="stat-card border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-md">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{activeStudents}</p>
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              de {students.length} matriculados
            </p>
          </CardContent>
        </Card>

        {/* Total Enrollments Card */}
        <Card className="stat-card border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matrículas (Ano)
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{totalEnrollments}</p>
              <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {avgEnrollments} por mês
            </p>
          </CardContent>
        </Card>

        {/* Morning Shift Card */}
        <Card className="stat-card border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turno Manhã
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
              <Sun className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{morningCount}</p>
              <span className="text-sm text-muted-foreground">alunos</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{
                  width: `${(morningCount / students.length) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Afternoon Shift Card */}
        <Card className="stat-card border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turno Tarde
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md">
              <Sun className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{afternoonCount}</p>
              <span className="text-sm text-muted-foreground">alunos</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                style={{
                  width: `${(afternoonCount / students.length) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollments Chart */}
        <Card className="lg:col-span-2 border-none shadow-lg animate-slide-up">
          <CardHeader className="border-b bg-gradient-to-r from-card to-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Matrículas por Mês
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Crescimento ao longo do ano
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                2024
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={enrollmentsByMonth}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(156, 43%, 13%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(156, 43%, 13%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 88%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(156, 10%, 42%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(156, 10%, 42%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(150, 12%, 88%)",
                    fontSize: "0.875rem",
                    backgroundColor: "hsl(0, 0%, 100%)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(156, 43%, 13%)"
                  strokeWidth={3}
                  fill="url(#colorCount)"
                  name="Matrículas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card className="border-none shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="border-b bg-gradient-to-r from-card to-accent/20">
            <CardTitle className="text-lg font-semibold text-foreground">
              Por Série
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Distribuição de alunos
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {gradeDistribution.map((g, idx) => (
                <div 
                  key={g.grade} 
                  className="group animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-foreground">{g.grade}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {Math.round((g.count / students.length) * 100)}%
                      </span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {g.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-emerald-600 to-emerald-700 rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                      style={{
                        width: `${(g.count / students.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
