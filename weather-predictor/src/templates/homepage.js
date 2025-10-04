/**
 * Homepage Template
 * NASA Weather Predictor API v2.2
 */

export const homepageHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NASA Weather Predictor API v2.2</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #0B3D91;
            font-size: 2.5em;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        h1::before {
            content: "🛰️";
            font-size: 1.2em;
        }
        .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        h2 {
            color: #0B3D91;
            margin: 30px 0 15px 0;
            font-size: 1.8em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .nasa-badge {
            background: linear-gradient(135deg, #0B3D91 0%, #1a5fb4 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(11, 61, 145, 0.3);
        }
        .nasa-badge h3 {
            margin: 0 0 15px 0;
            font-size: 1.3em;
        }
        .nasa-badge ul {
            list-style: none;
            padding: 0;
        }
        .nasa-badge li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .nasa-badge li:last-child {
            border-bottom: none;
        }
        .nasa-badge li::before {
            content: "✓";
            color: #4ade80;
            font-weight: bold;
            margin-right: 10px;
        }
        .endpoint {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            border-left: 4px solid #667eea;
        }
        .endpoint code {
            color: #0B3D91;
            font-weight: bold;
        }
        .example-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 5px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .example-card:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
        }
        .example-card h3 {
            color: #0B3D91;
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        .example-card p {
            color: #666;
            margin: 5px 0;
            font-size: 0.95em;
        }
        .example-card a {
            display: inline-block;
            margin-top: 10px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background 0.2s;
        }
        .example-card a:hover {
            background: #764ba2;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #4ade80;
        }
        .feature-item strong {
            color: #0B3D91;
            display: block;
            margin-bottom: 5px;
        }
        .links {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        .links a {
            padding: 12px 24px;
            background: #0B3D91;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: background 0.2s;
        }
        .links a:hover {
            background: #1a5fb4;
        }
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-style: italic;
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            h1 {
                font-size: 1.8em;
            }
            h2 {
                font-size: 1.4em;
            }
            .feature-list {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>NASA Weather Predictor API</h1>
        <p class="subtitle">Análise climática probabilística usando múltiplas fontes de dados NASA oficiais</p>

        <div class="nasa-badge">
            <h3>🛰️ Fontes de Dados NASA Integradas</h3>
            <ul>
                <li><strong>NASA POWER API</strong> - Dados históricos MERRA-2 (1980-presente) - Fonte principal</li>
                <li><strong>NASA Earthdata Search</strong> - Validação e metadados de datasets disponíveis</li>
                <li><strong>NASA Giovanni</strong> - Links para visualização interativa de dados</li>
            </ul>
        </div>

        <h2>📡 Endpoints Disponíveis</h2>

        <div class="endpoint">
            <code>GET /predict?lat={latitude}&lon={longitude}&date={YYYY-MM-DD}</code>
            <p>Retorna análise probabilística com metadados enriquecidos das 3 fontes NASA</p>
        </div>

        <div class="endpoint">
            <code>GET /health</code>
            <p>Status de saúde de todas as APIs NASA integradas</p>
        </div>

        <div class="endpoint">
            <code>GET /debug?lat={latitude}&lon={longitude}</code>
            <p>Informações detalhadas de debug e conectividade</p>
        </div>

        <h2>🎯 Exemplos Interativos</h2>

        <div class="example-card">
            <h3>❄️ Neve em São Joaquim - Inverno 2027</h3>
            <p><strong>Localização:</strong> São Joaquim, SC (-28.29°, -49.93°)</p>
            <p><strong>Data:</strong> 15 de julho de 2027 (pico do inverno)</p>
            <p><strong>Análise:</strong> Probabilidade de neve, temperatura, precipitação</p>
            <a href="/predict?lat=-28.29&lon=-49.93&date=2027-07-15">Ver Análise →</a>
        </div>

        <div class="example-card">
            <h3>💒 Planejamento de Casamento - Blumenau</h3>
            <p><strong>Localização:</strong> Blumenau, SC (-26.92°, -49.07°)</p>
            <p><strong>Data:</strong> 20 de setembro de 2027 (primavera)</p>
            <p><strong>Análise:</strong> Probabilidade de chuva, temperatura, vento</p>
            <a href="/predict?lat=-26.92&lon=-49.07&date=2027-09-20">Ver Análise →</a>
        </div>

        <div class="example-card">
            <h3>🌊 Verão em Balneário Camboriú</h3>
            <p><strong>Localização:</strong> Balneário Camboriú, SC (-26.99°, -48.63°)</p>
            <p><strong>Data:</strong> 15 de janeiro de 2027 (alta temporada)</p>
            <p><strong>Análise:</strong> Condições de praia, radiação solar, precipitação</p>
            <a href="/predict?lat=-26.99&lon=-48.63&date=2027-01-15">Ver Análise →</a>
        </div>

        <div class="example-card">
            <h3>🌍 Londres - Verão Europeu</h3>
            <p><strong>Localização:</strong> Londres, Reino Unido (51.51°, -0.13°)</p>
            <p><strong>Data:</strong> 1 de junho de 2026 (início do verão)</p>
            <p><strong>Análise:</strong> Padrões climáticos europeus, temperatura típica</p>
            <a href="/predict?lat=51.51&lon=-0.13&date=2026-06-01">Ver Análise →</a>
        </div>

        <div class="example-card">
            <h3>🗽 Nova York - Outono</h3>
            <p><strong>Localização:</strong> Nova York, EUA (40.71°, -74.01°)</p>
            <p><strong>Data:</strong> 15 de outubro de 2026 (outono)</p>
            <p><strong>Análise:</strong> Temperaturas outono, precipitação, vento</p>
            <a href="/predict?lat=40.71&lon=-74.01&date=2026-10-15">Ver Análise →</a>
        </div>

        <h2>🔬 Metodologia Científica</h2>

        <div class="feature-list">
            <div class="feature-item">
                <strong>NASA POWER</strong>
                30+ anos de dados históricos MERRA-2 (1980-presente)
            </div>
            <div class="feature-item">
                <strong>Earthdata CMR</strong>
                Validação de disponibilidade e qualidade dos dados
            </div>
            <div class="feature-item">
                <strong>Giovanni</strong>
                Links para visualização interativa (3 tipos de gráficos)
            </div>
            <div class="feature-item">
                <strong>Análise de probabilidade</strong>
                Cálculos probabilísticos avançados
            </div>
        </div>

        <h2>📊 Dados Retornados</h2>
        <ul style="margin-left: 20px; color: #666;">
            <li><strong>Predictions:</strong> Probabilidades para temperatura, precipitação, vento, nuvens, radiação solar, neve</li>
            <li><strong>Metadata:</strong> Informações sobre localização, data alvo, e período histórico analisado</li>
            <li><strong>Data Sources:</strong> Detalhes das 3 fontes NASA utilizadas</li>
            <li><strong>Validation:</strong> Datasets disponíveis via Earthdata para a localização</li>
            <li><strong>Visualization:</strong> 3 links Giovanni pré-configurados (time series, climatologia, comparação anual)</li>
        </ul>

        <h2>🔗 Links Úteis</h2>

        <div class="links">
            <a href="/health" target="_blank">Status da API</a>
            <a href="/debug" target="_blank">Debug Info</a>
            <a href="https://power.larc.nasa.gov/" target="_blank">NASA POWER</a>
            <a href="https://earthdata.nasa.gov/" target="_blank">Earthdata Search</a>
            <a href="https://giovanni.gsfc.nasa.gov/" target="_blank">NASA Giovanni</a>
        </div>

        <h2>✅ Conformidade NASA Space Apps Challenge</h2>
        <p style="color: #666; margin: 15px 0;">
            Esta API utiliza exclusivamente recursos NASA oficialmente listados no desafio:
        </p>
        <ul style="margin-left: 20px; color: #666;">
            <li>✓ NASA POWER API (power.larc.nasa.gov) - Dados meteorológicos</li>
            <li>✓ Earthdata Search (cmr.earthdata.nasa.gov) - Metadados e validação</li>
            <li>✓ Giovanni (giovanni.gsfc.nasa.gov) - Visualização interativa</li>
        </ul>

        <footer>
            <p>🚀 <strong>NASA Space Apps Challenge 2025</strong></p>
            <p>Demonstrando uso avançado e integração inteligente de múltiplas fontes de dados NASA</p>
            <p>Versão 2.2 - Multi-Source Integration</p>
        </footer>
    </div>
</body>
</html>`;
