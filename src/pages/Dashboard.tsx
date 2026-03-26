import { Users, GraduationCap, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { students, enrollmentsByMonth, grades } from "@/data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const activeStudents = students.filter((s) => s.status === "Ativo").length;
  const morningCount = students.filter((s) => s.shift === "Manhã").length;
  const afternoonCount = students.filter((s) => s.shift === "Tarde").length;

  const gradeDistribution = grades.map((grade) => ({
    grade,
    count: students.filter((s) => s.grade === grade).length,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{activeStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">
              de {students.length} matriculados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição por Série
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gradeDistribution.map((g) => (
                <div key={g.grade} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{g.grade}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(g.count / students.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-foreground w-4 text-right">
                      {g.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição por Turno
            </CardTitle>
            <Sun className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Manhã</span>
                  <span className="font-medium text-foreground">{morningCount}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(morningCount / students.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Tarde</span>
                  <span className="font-medium text-foreground">{afternoonCount}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full"
                    style={{
                      width: `${(afternoonCount / students.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Matrículas por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={enrollmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid hsl(214,32%,91%)",
                  fontSize: "0.875rem",
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(216,100%,34%)"
                radius={[6, 6, 0, 0]}
                name="Matrículas"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
