import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Users, GraduationCap, Sun, Sunset, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, alunosApi, matriculasApi, Matricula, AlunoComMatriculas, getMatriculaAtiva } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { GRADES, SHIFTS, YEAR_RANGE, CURRENT_YEAR } from "@/lib/constants";

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => dashboardApi.getMetrics(),
    refetchOnMount: "always",
  });

  const { data: alunosData } = useQuery({
    queryKey: ["alunos", "all"],
    queryFn: () => alunosApi.list({ limit: 1000 }),
    refetchOnMount: "always",
  });

  const { data: matriculas = [] } = useQuery({
    queryKey: ["matriculas", "all"],
    queryFn: () => matriculasApi.listAll(),
    refetchOnMount: "always",
  });

  const enrollmentByYear = useMemo(() => {
    const data = YEAR_RANGE.map((year) => ({ name: year, total: 0 }));
    (matriculas as Matricula[]).forEach((m) => {
      if (m.status !== "Ativo" && m.status !== "Concluído") return;
      const yearStr = m.ano_letivo?.toString();
      if (yearStr && YEAR_RANGE.includes(yearStr)) {
        const entry = data.find((d) => d.name === yearStr);
        if (entry) entry.total += 1;
      }
    });
    return data;
  }, [matriculas]);

  const students = (alunosData?.items || []) as AlunoComMatriculas[];
  const activeStudents = metrics?.total_alunos_ativos || 0;
  const morningCount = metrics?.alunos_manhã || 0;
  const afternoonCount = metrics?.alunos_tarde || 0;

  const seriesOrder = GRADES;
  const turnoLabel: Record<string, string> = { "Manhã": "M", "Tarde": "T" };

  const currentYearActiveStudents = useMemo(() => {
    return students.filter((s) => {
      const matriculas = (s as AlunoComMatriculas).matriculas;
      if (!matriculas) return false;
      return matriculas.some((m) => m.status === "Ativo" && m.ano_letivo === CURRENT_YEAR);
    });
  }, [students]);

  const gradeDistribution = useMemo(() => {
    return seriesOrder
      .map((serie) => ({
        serie,
        count: currentYearActiveStudents.filter((s) => {
          const mat = getMatriculaAtiva(s);
          return (mat?.serie || s.serie) === serie;
        }).length,
      }))
      .filter((g) => g.count > 0);
  }, [currentYearActiveStudents, seriesOrder]);

  const totalEnrollments = enrollmentByYear.reduce((sum, m) => sum + m.total, 0);
  const avgEnrollments = Math.round(totalEnrollments / enrollmentByYear.length);

  const activeTrend = useMemo(() => {
    const current = enrollmentByYear[enrollmentByYear.length - 1]?.total ?? 0;
    const previous = enrollmentByYear[enrollmentByYear.length - 2]?.total ?? 0;
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }, [enrollmentByYear]);

  const enrollmentTrend = useMemo(() => {
    if (enrollmentByYear.length < 2) return null;
    const current = enrollmentByYear[enrollmentByYear.length - 1]?.total ?? 0;
    const previous = enrollmentByYear[enrollmentByYear.length - 2]?.total ?? 0;
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }, [enrollmentByYear]);

  const turnosOrder = SHIFTS;

  const genderBySerieTurno = seriesOrder.flatMap((serie) =>
    turnosOrder.map((turno) => {
      const alunos = currentYearActiveStudents.filter((s) => {
        const mat = getMatriculaAtiva(s);
        return (mat?.serie || s.serie) === serie && (mat?.turno || s.turno) === turno;
      });
      const masculino = alunos.filter((s) => s.genero === "Masculino").length;
      const feminino = alunos.filter((s) => s.genero === "Feminino").length;
      const shortSerie = serie.replace("º Ano", "º");
      return {
        name: `${shortSerie}-${turnoLabel[turno]}`,
        masculino,
        feminino,
        total: masculino + feminino,
      };
    })
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Erro ao carregar dados do dashboard.</p>
      </div>
    );
  }

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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{activeStudents}</p>
              {activeTrend !== null && activeTrend !== 0 ? (
                <Badge
                  variant="secondary"
                  className={
                    activeTrend > 0
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {activeTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1 rotate-180" />}
                  {activeTrend > 0 ? "+" : ""}{activeTrend}%
                </Badge>
              ) : null}
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{totalEnrollments}</p>
              {enrollmentTrend !== null && enrollmentTrend !== 0 ? (
                <Badge
                  variant="secondary"
                  className={
                    enrollmentTrend > 0
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {enrollmentTrend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1 rotate-180" />}
                  {enrollmentTrend > 0 ? "+" : ""}{enrollmentTrend}%
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {avgEnrollments} por ano
            </p>
          </CardContent>
        </Card>

        {/* Morning Shift Card */}
        <Card className="stat-card border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turno Manhã
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#EF7F2D] to-[#D96518] flex items-center justify-center shadow-md">
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
                className="h-full bg-gradient-to-r from-[#EF7F2D] to-[#D96518] rounded-full transition-all duration-500"
                style={{
                  width: activeStudents > 0 ? `${(morningCount / activeStudents) * 100}%` : '0%',
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#EF7F2D] to-[#D96518] flex items-center justify-center shadow-md">
              <Sunset className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{afternoonCount}</p>
              <span className="text-sm text-muted-foreground">alunos</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#EF7F2D] to-[#D96518] rounded-full transition-all duration-500"
                style={{
                  width: activeStudents > 0 ? `${(afternoonCount / activeStudents) * 100}%` : '0%',
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <Card className="border-none shadow-lg animate-slide-up">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg font-semibold text-foreground">
              Por Série
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Distribuição de alunos ativos ({CURRENT_YEAR})
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {gradeDistribution.map((g, idx) => (
                <div 
                  key={g.serie} 
                  className="group animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-foreground">{g.serie}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {activeStudents > 0 ? Math.round((g.count / activeStudents) * 100) : 0}%
                      </span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {g.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-[#01182C]/80 rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                      style={{
                        width: activeStudents > 0 ? `${(g.count / activeStudents) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
              {gradeDistribution.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gender by Serie & Turno */}
        <Card className="lg:col-span-2 border-none shadow-lg animate-slide-up">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Alunos por Gênero, Série e Turno
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Distribuição de alunos e alunas ativos ({CURRENT_YEAR})
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {genderBySerieTurno.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={genderBySerieTurno}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 88%)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(156, 10%, 42%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(156, 10%, 42%)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(150, 12%, 88%)",
                      fontSize: "0.875rem",
                      backgroundColor: "hsl(0, 0%, 100%)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "masculino" ? "Masculino" : "Feminino",
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => value === "masculino" ? "Masculino" : "Feminino"}
                  />
                  <Bar
                    stackId="a"
                    dataKey="masculino"
                    fill="#01182C"
                    name="masculino"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    stackId="a"
                    dataKey="feminino"
                    fill="#EF7F2D"
                    name="feminino"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum dado disponível
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Evolution Chart */}
      <Card className="border-none shadow-lg animate-slide-up">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Evolução de Matrículas
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Total de alunos por ano letivo
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={enrollmentByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 12%, 88%)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 14, fontWeight: 600, fill: "hsl(156, 10%, 42%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(156, 10%, 42%)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid hsl(150, 12%, 88%)",
                  fontSize: "0.875rem",
                  backgroundColor: "hsl(0, 0%, 100%)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [value, "Alunos"]}
              />
              <Bar dataKey="total" fill="#01182C" name="Matrículas" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
