/**
 * NASA Earthdata CMR Client
 *
 * Fonte: NASA Earthdata Search (recurso oficial listado)
 * API: Common Metadata Repository (CMR)
 * Propósito: Validar disponibilidade de dados e enriquecer metadados
 */

class EarthdataClient {
    constructor() {
        this.cmrBaseURL = "https://cmr.earthdata.nasa.gov/search";
    }

    /**
     * Busca metadados de datasets disponíveis para uma localização
     * Usado apenas para validação e enriquecimento de informações
     */
    async fetchDatasetMetadata(lat, lon) {
        try {
            // Buscar apenas metadados dos principais datasets meteorológicos
            const datasets = [
                "GPM_3IMERGDF", // Precipitação global
                "M2T1NXSLV", // MERRA-2 temperatura e meteorologia
            ];

            const availableDatasets = [];

            for (const shortName of datasets) {
                const params = new URLSearchParams({
                    short_name: shortName,
                    point: `${lon},${lat}`,
                    page_size: 1,
                });

                const response = await fetch(
                    `${this.cmrBaseURL}/collections.json?${params}`,
                    {
                        headers: {
                            Accept: "application/json",
                            "User-Agent": "NASA-Weather-Predictor/2.1",
                        },
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.feed?.entry?.length > 0) {
                        const entry = data.feed.entry[0];
                        availableDatasets.push({
                            name: entry.title || shortName,
                            shortName: shortName,
                            description: this.getDatasetDescription(shortName),
                        });
                    }
                }
            }

            return {
                success: true,
                datasets: availableDatasets,
                location: { lat, lon },
            };
        } catch (error) {
            console.warn(
                "Earthdata metadata fetch failed (non-critical):",
                error.message,
            );
            // Não falhar a requisição principal se metadados falharem
            return {
                success: false,
                datasets: [],
                error: error.message,
            };
        }
    }

    /**
     * Descrições amigáveis dos datasets
     */
    getDatasetDescription(shortName) {
        const descriptions = {
            GPM_3IMERGDF:
                "Global Precipitation Measurement - Precipitação diária",
            M2T1NXSLV: "MERRA-2 - Dados meteorológicos de superfície",
        };
        return descriptions[shortName] || shortName;
    }

    /**
     * Gera URL para visualização no Giovanni
     * Giovanni é outro recurso oficial NASA listado
     */
    generateGiovanniLink(lat, lon, targetDate) {
        // Giovanni tem limite de time steps para usuários não autenticados
        // Usamos dados mensais do ano da previsão para evitar o limite

        const targetYear = new Date(targetDate).getFullYear();
        const targetMonth = new Date(targetDate).getMonth() + 1;

        // Giovanni permite visualizar dados interativamente
        const baseURL = "https://giovanni.gsfc.nasa.gov/giovanni/";

        // Usar dados mensais do ano alvo (12 meses = bem abaixo do limite de 4 steps diários)
        // Ou usar climatologia mensal se quiser evitar completamente
        const params = new URLSearchParams({
            service: "TmAvMp", // Time Averaged Map
            starttime: `${targetYear}-01-01`,
            endtime: `${targetYear}-12-31`,
            bbox: `${lon - 2},${lat - 2},${lon + 2},${lat + 2}`, // Região ao redor do ponto
            data: "TRMM_3B42_Daily_7_precipitation",
            dataKeyword: "TRMM",
        });

        return `${baseURL}#${params.toString()}`;
    }

    /**
     * Gera múltiplos links úteis do Giovanni para diferentes visualizações
     * OTIMIZADO: Links que realmente funcionam sem login
     */
    generateGiovanniLinks(lat, lon, targetDate) {
        const targetYear = new Date(targetDate).getFullYear();
        const targetMonth = String(
            new Date(targetDate).getMonth() + 1,
        ).padStart(2, "0");
        const prevYear = targetYear - 1;

        const baseURL = "https://giovanni.gsfc.nasa.gov/giovanni/";

        // Ajustar bounding box para garantir área válida
        const latMin = (lat - 1).toFixed(2);
        const latMax = (lat + 1).toFixed(2);
        const lonMin = (lon - 1).toFixed(2);
        const lonMax = (lon + 1).toFixed(2);

        return {
            // Time Series com apenas 3 pontos mensais (bem abaixo do limite)
            time_series: `${baseURL}#service=TmAvTs&starttime=${targetYear}-${targetMonth}-01&endtime=${targetYear}-${String(parseInt(targetMonth) + 2).padStart(2, "0")}-01&bbox=${lonMin},${latMin},${lonMax},${latMax}&data=TRMM_3B42_Daily_7_precipitation`,

            // Climatologia - sempre funciona (usa dados históricos agregados)
            climatology: `${baseURL}#service=ClMp&starttime=${targetYear}-${targetMonth}-01&endtime=${targetYear}-${targetMonth}-01&bbox=${lonMin},${latMin},${lonMax},${latMax}&data=TRMM_3B42_Daily_7_precipitation`,

            // Mapa de diferença entre anos (2 time steps apenas)
            annual_comparison: `${baseURL}#service=MpDfMn&starttime=${prevYear}-${targetMonth}-01&endtime=${targetYear}-${targetMonth}-01&bbox=${lonMin},${latMin},${lonMax},${latMax}&data=TRMM_3B42_Daily_7_precipitation`,

            // Link principal (portal Giovanni para exploração manual)
            explorer: "https://giovanni.gsfc.nasa.gov/giovanni/",

            // Instruções para o usuário
            instructions:
                "Para períodos maiores, faça login no Giovanni ou use o Explorer para configurar manualmente",
        };
    }

    /**
     * Teste de conectividade
     */
    async testConnection() {
        try {
            const response = await fetch(
                `${this.cmrBaseURL}/collections.json?page_size=1`,
                { headers: { Accept: "application/json" } },
            );

            return {
                healthy: response.ok,
                status: response.status,
                message: response.ok
                    ? "NASA Earthdata CMR está acessível"
                    : `Earthdata CMR retornou ${response.status}`,
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                message: "Não foi possível conectar com Earthdata CMR",
            };
        }
    }
}

export default EarthdataClient;
