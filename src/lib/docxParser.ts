import JSZip from "jszip";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export interface ParsedStudent {
  nome: string;
  datanascimento?: string;
  naturalidade?: string;
  nomedocartorio?: string;
  numerodotermo?: string;
  livro?: string;
  folha?: string;
  matriculadocartorio?: string;
  cpf?: string;
  nis?: string;
  datadovencimento?: string;
  cor?: string;
  nomedopai?: string;
  rgdopai?: string;
  cpfdopai?: string;
  nomedamae?: string;
  rgmae?: string;
  cpfmae?: string;
  responsavelfinanceiro?: string;
  datanascimentoresponsavelfin?: string;
  filiacaoresponsavelfin?: string;
  rgrespfin?: string;
  cpfrespfin?: string;
  possuiirmao?: boolean;
  nomeirmao?: string;
  telefone1?: string;
  telefone2?: string;
  telefone3?: string;
  logradouro?: string;
  cep?: string;
  cidadetelefone?: string;
  estadotelefone?: string;
  matriculas: {
    serie: string;
    ano?: number;
    turno?: string;
    datamatricula?: string;
  }[];
  _sourceFile?: string;
}

export interface ParseResult {
  students: ParsedStudent[];
  errors: string[];
}

function extractAllText(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const paragraphs: string[] = [];
  const allP = doc.getElementsByTagNameNS(W_NS, "p");

  for (let i = 0; i < allP.length; i++) {
    const p = allP[i];
    const texts: string[] = [];
    const tElements = p.getElementsByTagNameNS(W_NS, "t");

    for (let j = 0; j < tElements.length; j++) {
      const t = tElements[j];
      if (t.textContent) texts.push(t.textContent);
    }

    if (texts.length > 0) {
      paragraphs.push(texts.join(""));
    }
  }

  return paragraphs.join("\n");
}

function normalizeText(raw: string): string {
  let text = raw
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const secondHeader = text.indexOf("FICHA D");
  if (secondHeader > 100) {
    const firstHeader = text.indexOf("FICHA D");
    if (firstHeader >= 0 && secondHeader > firstHeader) {
      const secondOccurrence = text.indexOf("FICHA D", firstHeader + 10);
      if (secondOccurrence > 0) {
        text = text.substring(0, secondOccurrence);
      }
    }
  }

  return text;
}

function cleanValue(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const trimmed = v.trim();
  if (!trimmed || trimmed === "_" || trimmed.match(/^[_\s\-./]+$/)) return undefined;
  return trimmed;
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function parseCoursesSection(text: string): ParsedStudent["matriculas"] {
  const matriculas: ParsedStudent["matriculas"] = [];

  const courseRegex =
    /Curso:\s*(.+?)\s*Ano\s*:?\s*(\d{4})?\s*Turno\s*:?\s*(Manhã|Tarde|Manha)?\s*Matriculado\s*\(?a\)?\s*em\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})?/gi;

  let match;
  while ((match = courseRegex.exec(text)) !== null) {
    const serie = cleanValue(match[1]);
    if (!serie) continue;

    matriculas.push({
      serie,
      ano: match[2] ? parseInt(match[2]) : undefined,
      turno: match[3] || undefined,
      datamatricula: cleanValue(match[4]),
    });
  }

  return matriculas;
}

function parseSingleForm(text: string): ParsedStudent {
  const student: ParsedStudent = {
    nome: "",
    matriculas: [],
  };

  student.nome = toTitleCase(cleanValue(
    text.match(/Aluno\(a\):\s*(.+?)(?=\s*Data de nascimento)/i)?.[1]
  ) || "");

  student.datanascimento = cleanValue(
    text.match(/Data de nascimento:\s*(.+?)(?=\s*Naturalidade)/i)?.[1]
  );

  student.naturalidade = cleanValue(
    text.match(/Naturalidade:\s*(.+?)(?=\s*Cartório)/i)?.[1]
  );

  student.nomedocartorio = cleanValue(
    text.match(/Cartório:\s*(.+?)(?=\s*Termo)/i)?.[1]
  );

  student.numerodotermo = cleanValue(
    text.match(/Termo\s*Nº?:\s*(.+?)(?=\s*Livro)/i)?.[1]
  );

  student.livro = cleanValue(
    text.match(/Livro:\s*(.+?)(?=\s*Folha)/i)?.[1]
  );

  student.folha = cleanValue(
    text.match(/Folha:\s*(.+?)(?=\s*Matrícula)/i)?.[1]
  );

  student.matriculadocartorio = cleanValue(
    text.match(/Matrícula\s*:\s*(.+?)(?=\s*RG)/i)?.[1]
  );

  student.cpf = cleanValue(
    text.match(/CPF:\s*([\d.]+-?\d+)/i)?.[1]
  );

  student.nis = cleanValue(
    text.match(/NIS:\s*(.+?)(?=\s*Data do Venc)/i)?.[1]
  );

  student.datadovencimento = cleanValue(
    text.match(/Data do Venc.?:\s*(\d+)/i)?.[1]
  );

  const corMatch = text.match(
    /Cor\/Raça:\s*(O Branca|O Preta|O Parda|O Amarela|O Indígena|O Não Declarada)/i
  );
  if (corMatch) {
    student.cor = corMatch[1].replace(/^O\s+/, "").trim();
  }

  student.nomedopai = toTitleCase(cleanValue(
    text.match(/Nome do Pai:\s*(.+?)(?=\s*RG)/i)?.[1]
  ) || "");

  const rgsAfterPai = text.match(/Nome do Pai:.+?RG:\s*(.+?)(?=\s*CPF)/is)?.[1];
  if (rgsAfterPai && !rgsAfterPai.includes("RESP.")) {
    student.rgdopai = cleanValue(rgsAfterPai);
  }

  const cpfsAfterPai = text.match(/Nome do Pai:.+?CPF:\s*(.+?)(?=\s*(?:Nome d|RESP))/is)?.[1];
  if (cpfsAfterPai) {
    student.cpfdopai = cleanValue(cpfsAfterPai.match(/[\d.]+-?\d+/)?.[0]);
  }

  student.nomedamae = toTitleCase(cleanValue(
    text.match(/Nome d[ao]\s*Mãe:\s*(.+?)(?=\s*RG)/i)?.[1]
  ) || "");

  const rgsAfterMae = text.match(/Nome d[ao]\s*Mãe:.+?RG:\s*(.+?)(?=\s*CPF)/is)?.[1];
  if (rgsAfterMae && !rgsAfterMae.includes("RESP.")) {
    student.rgmae = cleanValue(rgsAfterMae);
  }

  student.responsavelfinanceiro = toTitleCase(cleanValue(
    text.match(/RESP(?:ONSIVO)?\.?\s*FINANCEIRO\s*:?\s*(.+?)(?=\s*Nascimento)/i)?.[1]
  ) || "");

  student.datanascimentoresponsavelfin = cleanValue(
    text.match(/(?<!de )nascimento:\s*(.+?)(?=\s*filiação)/i)?.[1]
  );

  student.filiacaoresponsavelfin = toTitleCase(cleanValue(
    text.match(/Filiação:\s*(.+?)(?=\s*RG)/i)?.[1]
  ) || "");

  const rgsAfterResp = text.match(/Filiação:.+?RG\s*:?\s*(.+?)(?=\s*CPF)/is)?.[1];
  if (rgsAfterResp) {
    student.rgrespfin = cleanValue(rgsAfterResp);
  }

  const cpfsAfterResp = text.match(
    /Filiação:.+?CPF:\s*(.+?)(?=\s*Valor)/is
  )?.[1];
  if (cpfsAfterResp) {
    student.cpfrespfin = cleanValue(cpfsAfterResp.match(/[\d.]+-?\d+/)?.[0]);
  }

  const valorMatch =     text.match(/Valor:\s*R\$\s*([\d.,]+)/i);
  if (valorMatch) {
    student.valormensalidade = parseFloat(
      valorMatch[1].replace(/\./g, "").replace(",", ".")
    );
  }

  const possuiirmaoMatch = text.match(
    /Possui\s*irmãos?\s*(?:na escola)?\s*\?\s*\(([^)]*)\)\s*sim.*?\(([^)]*)\)\s*não/i
  );
  if (possuiirmaoMatch) {
    student.possuiirmao = possuiirmaoMatch[2].includes("X");
  }

  student.telefone1 = cleanValue(
    text.match(/Celular do Pai:\s*([\d\s\-().]+)/i)?.[1]
  );

  student.telefone2 = cleanValue(
    text.match(/Celular da Mãe:\s*([\d\s\-().]+)/i)?.[1]
  );

  student.telefone3 = cleanValue(
    text.match(/Telefone fixo\s*\/?\s*Outros:\s*([\d\s\-().]+)/i)?.[1]
  );

  student.logradouro = cleanValue(
    text.match(/Av.\/Rua:\s*(.+?)(?=\s*CEP)/i)?.[1]
  );

  student.cep = cleanValue(text.match(/CEP:\s*(\d[\d\-./]+)/i)?.[1]);

  const coursesSection = text.match(/SÉRIES CURSADAS\s*(.*)/i);
  if (coursesSection) {
    student.matriculas = parseCoursesSection(coursesSection[1]);
  }

  return student;
}

export async function parseDocxFiles(files: File[]): Promise<ParseResult> {
  const result: ParseResult = { students: [], errors: [] };

  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const docXml = await zip.file("word/document.xml")?.async("text");
      if (!docXml) {
        result.errors.push(`${file.name}: arquivo .docx inválido`);
        continue;
      }

      const rawText = extractAllText(docXml);
      const text = normalizeText(rawText);

      if (!text.includes("Aluno(a):")) {
        result.errors.push(
          `${file.name}: não foi possível identificar dados de aluno`
        );
        continue;
      }

      const student = parseSingleForm(text);
      if (student.nome) {
        student._sourceFile = file.name;
        result.students.push(student);
      } else {
        result.errors.push(`${file.name}: nome do aluno não encontrado`);
      }
    } catch {
      result.errors.push(`${file.name}: erro ao processar arquivo`);
    }
  }

  return result;
}
