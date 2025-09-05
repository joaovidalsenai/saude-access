// formatar.js
const formatar = {

  cpf(valor) {
    const dig = String(valor ?? "").replace(/\D+/g, "").slice(0, 11);
    return dig.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  },

  telefone(valor) {
    let dig = String(valor ?? "").replace(/\D+/g, "");

    // Remove código do país (55) se vier no início
    if (dig.startsWith("55") && dig.length > 11) {
      dig = dig.slice(2);
    }

    if (dig.length === 10) {
      return dig.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    if (dig.length === 11) {
      return dig.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    return valor; // Se não tiver 10 ou 11 dígitos, retorna como veio
  },

  data(valor) {
    if (!valor) return valor;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!match) return valor; // retorna original se não estiver no formato esperado
    const [, ano, mes, dia] = match;
    return `${dia}/${mes}/${ano}`;
  },

  nome(valor) {
    if (!valor) return valor;

    const conectivos = ["de", "da", "do", "das", "dos", "e"];

    return valor
      .toLowerCase()
      .split(/\s+/)
      .map((palavra, i) => {
        if (conectivos.includes(palavra) && i !== 0) {
          return palavra;
        }

        // Trata nomes compostos com hífen
        return palavra
          .split("-")
          .map(
            parte => parte.charAt(0).toUpperCase() + parte.slice(1)
          )
          .join("-");
      })
      .join(" ");
  },
};

export default formatar;