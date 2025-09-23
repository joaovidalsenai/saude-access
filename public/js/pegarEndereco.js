document.addEventListener('DOMContentLoaded', () => {
  const locationButton = document.getElementById('get-location-btn');

  if (locationButton) {
    locationButton.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        // Pedir a localização ao usuário
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          console.log(`Coordenadas obtidas: ${latitude}, ${longitude}`);

          // Etapa 2: Enviar as coordenadas para o seu back-end
          try {
            const response = await fetch(`/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            const addressData = await response.json();

            if (addressData.error) {
              console.error('Erro no servidor:', addressData.error);
              alert('Não foi possível encontrar o endereço para esta localização.');
            } else {
              console.log('Endereço encontrado:', addressData);
              // Agora você pode usar os dados do endereço para preencher um campo, mostrar um mapa, etc.
              alert(`Endereço aproximado: ${addressData.formatted_address}`);
            }
          } catch (err) {
            console.error('Falha ao comunicar com o servidor:', err);
            alert('Ocorreu um erro ao buscar o endereço.');
          }

        }, (error) => {
          // Tratar erros (ex: usuário negou a permissão)
          console.error('Erro ao obter a localização:', error.message);
          alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        });
      } else {
        alert('Geolocalização não é suportada por este navegador.');
      }
    });
  }
});