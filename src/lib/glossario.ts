export const GLOSSARIO: Record<string, string> = {
  "score de valorização":
    "Nota de 0 a 100 que estima o potencial de valorização do imóvel, combinando preço/m² frente à média do bairro, pressão de demanda, momentum macroeconômico e estágio da obra.",
  "score de renda":
    "Nota de 0 a 100 que estima o potencial de geração de renda via aluguel, combinando yield líquido anual e comparação com o CDI.",
  encaixe:
    "Cruzamento entre o perfil do investidor e os scores do imóvel — o mesmo imóvel pode ter um encaixe ótimo para um perfil e ruim para outro.",
  "yield bruto":
    "Aluguel anual estimado dividido pelo preço do imóvel, sem descontar custos.",
  "yield líquido":
    "Yield bruto descontando vacância, taxa de administração e IPTU — uma estimativa mais realista do retorno de aluguel.",
  "cenário pessimista": "Percentil 10 das simulações de valorização (Monte Carlo) — 90% dos cenários simulados são melhores que este.",
  "cenário base": "Percentil 50 (mediana) das simulações de valorização — o resultado mais provável.",
  "cenário otimista": "Percentil 90 das simulações de valorização — apenas 10% dos cenários simulados são melhores que este.",
  "selo de confiança":
    "Mede o quão perto as projeções passadas do modelo ficaram da realidade, comparando projeção x realizado 6-12 meses depois.",
  "sistema price": "Amortização com parcelas fixas ao longo de todo o financiamento.",
  "sistema sac": "Amortização constante — parcelas mais altas no início, decrescendo mês a mês.",
};
