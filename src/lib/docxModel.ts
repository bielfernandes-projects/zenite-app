import JSZip from "jszip";

const MODEL_DOCX_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t xml:space="preserve">FICHA DE MATRÍCULA - MODELO</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Aluno(a): NOME COMPLETO DO ALUNO</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Data de Nascimento: DD/MM/AAAA</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Naturalidade: CIDADE/UF</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Cartório: NOME DO CARTÓRIO</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Termo Nº: 12345</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Livro: A</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Folha: 123</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Matrícula: 123456</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">RG: 0000000</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">CPF: 000.000.000-00</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">NIS: 000.00000.00-0</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Data do Venc.: 10</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Cor/Raça: (O Branca) (O Preta) (O Parda) (O Amarela) (O Indígena) (O Não Declarada)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Nome do Pai: NOME DO PAI  RG: 0000000  CPF: 000.000.000-00</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Nome da Mãe: NOME DA MÃE  RG: 0000000  CPF: 000.000.000-00</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">RESP. FINANCEIRO: NOME DO RESPONSÁVEL</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Data de Nascimento: DD/MM/AAAA</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Filiação: FILIAÇÃO DO RESPONSÁVEL</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">RG: 0000000  CPF: 000.000.000-00</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Valor: R$ 1.200,00</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Possui irmãos na escola? ( ) sim (X) não</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Celular do Pai: (00) 00000-0000</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Celular da Mãe: (00) 00000-0000</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Telefone fixo/Outros: (00) 0000-0000</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Av./Rua: RUA EXEMPLO, 123</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">CEP: 60000-000</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">SÉRIES CURSADAS:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Curso: 1º Ano  Ano: 2024  Turno: Manhã  Matriculado em: 15/02/2024</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Curso: 2º Ano  Ano: 2025  Turno: Manhã  Matriculado em: 10/02/2025</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

export async function generateModelDocx(): Promise<Blob> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file("word/document.xml", MODEL_DOCX_TEMPLATE);
  return await zip.generateAsync({ type: "blob" });
}

export const RECOGNIZED_FIELDS = [
  "Aluno(a)",
  "Data de Nascimento",
  "Naturalidade",
  "Cartório / Termo Nº / Livro / Folha / Matrícula",
  "RG / CPF / NIS",
  "Data do Venc.",
  "Cor/Raça (Branca, Preta, Parda, Amarela, Indígena, Não Declarada)",
  "Nome do Pai / RG / CPF",
  "Nome da Mãe / RG / CPF",
  "RESP. FINANCEIRO / Nascimento / Filiação / RG / CPF",
  "Valor (R$)",
  "Possui irmãos na escola? (sim/não)",
  "Celular do Pai / Celular da Mãe / Telefone fixo",
  "Av./Rua / CEP",
  "SÉRIES CURSADAS (Curso, Ano, Turno, Matriculado em)",
];
