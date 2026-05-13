




import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import MapPicker from './components/MapPicker';
import './index.css';

const solarLogo =
  'https://api.iconify.design/lucide:sun.svg?color=%23ffffff';

const leafLogo =
  'https://api.iconify.design/lucide:leaf.svg?color=%23ffffff';

const mapLogo =
  'https://api.iconify.design/lucide:map-pin.svg?color=%23ffffff';

const factoryLogo =
  'https://api.iconify.design/lucide:factory.svg?color=%23ffffff';

const homeLogo =
  'https://api.iconify.design/lucide:home.svg?color=%23ffffff';

const buildingLogo =
  'https://api.iconify.design/lucide:building-2.svg?color=%23ffffff';

const shieldLogo =
  'https://api.iconify.design/lucide:shield-check.svg?color=%23ffffff';

const databaseLogo =
  'https://api.iconify.design/lucide:database.svg?color=%23ffffff';

const satelliteLogo =
  'https://api.iconify.design/lucide:satellite.svg?color=%23ffffff';

const calculatorLogo =
  'https://api.iconify.design/lucide:calculator.svg?color=%23ffffff';

const checkLogo =
  'https://api.iconify.design/lucide:check.svg?color=%23ffffff';

const arrowLogo =
  'https://api.iconify.design/lucide:arrow-right.svg?color=%23ffffff';

const githubLogo =
  'https://api.iconify.design/simple-icons:github.svg?color=%23ffffff';

const linkedinLogo =
  'https://api.iconify.design/simple-icons:linkedin.svg?color=%23ffffff';

function App() {
  const [formData, setFormData] = useState({
    lat: 28.61,
    lon: 77.2,
    area: 10,
    eff: 0.18,
    days: 365,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');

  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendStatusMessage, setBackendStatusMessage] = useState(
    'Checking backend connection...'
  );

  const [mapRenderKey, setMapRenderKey] = useState(0);

  const calculatorRef = useRef(null);
  const datasetRef = useRef(null);
  const workflowRef = useRef(null);
  const marketRef = useRef(null);
  const teamRef = useRef(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get('/api/backend-status', {
          timeout: 10000,
        });

        const data = response.data;

        if (data?.backend_online === true) {
          if (data?.hf_online === true && data?.hf_model_loaded === true) {
            setBackendStatus('online');
            setBackendStatusMessage('Backend online. Model API connected.');
          } else if (data?.hf_online === true) {
            setBackendStatus('warning');
            setBackendStatusMessage(
              'Backend online, but model is still loading. Please wait.'
            );
          } else {
            setBackendStatus('warning');
            setBackendStatusMessage(
              'Backend online, but Hugging Face model API is offline.'
            );
          }
        } else {
          setBackendStatus('offline');
          setBackendStatusMessage('No backend connection.');
        }
      } catch (error) {
        console.error('Backend status check failed:', error);
        setBackendStatus('offline');
        setBackendStatusMessage(
          'No backend connection. Please start the backend server.'
        );
      }
    };

    checkBackend();

    const interval = setInterval(checkBackend, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMapRenderKey((prev) => prev + 1);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNumberChange = (key, value) => {
    const parsedValue = parseFloat(value);

    setFormData((prev) => ({
      ...prev,
      [key]: value === '' ? '' : parsedValue,
    }));

    setBackendError('');
  };

  const handleMapLocationSelect = useCallback((selectedLocation) => {
    setFormData((prev) => ({
      ...prev,
      lat: Number(Number(selectedLocation.lat).toFixed(6)),
      lon: Number(Number(selectedLocation.lon).toFixed(6)),
    }));

    setBackendError('');
  }, []);

  const calculate = async () => {
    if (loading) return;

    if (
      formData.lat === '' ||
      formData.lon === '' ||
      formData.area === '' ||
      Number.isNaN(Number(formData.lat)) ||
      Number.isNaN(Number(formData.lon)) ||
      Number.isNaN(Number(formData.area))
    ) {
      setResult(null);
      setBackendError('Please enter valid latitude, longitude, and panel area.');
      return;
    }

    if (backendStatus === 'offline') {
      setResult(null);
      setBackendError(
        'No backend connection. Please start the backend server and try again.'
      );
      return;
    }

    setLoading(true);
    setBackendError('');
    setResult(null);

    try {
      const response = await axios.post('/api/calculate', formData, {
        timeout: 120000,
      });

      setResult(response.data);
      setBackendStatus('online');
      setBackendStatusMessage('Backend online. Model API connected.');
    } catch (err) {
      console.error('Backend connection failed:', err);

      setResult(null);

      if (err.code === 'ECONNABORTED') {
        setBackendError(
          'Backend request timed out. Hugging Face Space may be waking up. Please try again.'
        );
      } else if (!err.response) {
        setBackendStatus('offline');
        setBackendStatusMessage(
          'No backend connection. Please start the backend server.'
        );
        setBackendError(
          'No backend connection. Please start the backend server and try again.'
        );
      } else {
        setBackendError(
          err.response?.data?.detail ||
            'Backend error. Calculation could not be completed.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBoxStyle = () => {
    if (backendStatus === 'online') {
      return {
        border: '1px solid rgba(34, 197, 94, 0.35)',
        background: 'rgba(34, 197, 94, 0.12)',
        color: '#bbf7d0',
      };
    }

    if (backendStatus === 'warning') {
      return {
        border: '1px solid rgba(245, 158, 11, 0.45)',
        background: 'rgba(245, 158, 11, 0.12)',
        color: '#fde68a',
      };
    }

    return {
      border: '1px solid rgba(239, 68, 68, 0.35)',
      background: 'rgba(239, 68, 68, 0.12)',
      color: '#fecaca',
    };
  };

  return (
    <div className="landing-page">
      <div className="landing-gradient landing-gradient-one"></div>
      <div className="landing-gradient landing-gradient-two"></div>
      <div className="landing-gradient landing-gradient-three"></div>
      <div className="landing-gradient landing-gradient-four"></div>

      <div className="landing-grid-bg"></div>
      <div className="landing-noise-bg"></div>

      <header className="landing-header">
        <button
          type="button"
          className="landing-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="landing-logo-icon">
            <Icon src={solarLogo} alt="SolarCarbon" size={22} />
          </div>

          <span>SolarCarbon</span>
        </button>

        <nav className="landing-nav">
          <button
            type="button"
            onClick={() => scrollToSection(calculatorRef)}
            className="landing-nav-link"
          >
            Calculator
          </button>

          <button
            type="button"
            onClick={() => scrollToSection(datasetRef)}
            className="landing-nav-link"
          >
            Dataset
          </button>

          <button
            type="button"
            onClick={() => scrollToSection(workflowRef)}
            className="landing-nav-link"
          >
            Workflow
          </button>

          <button
            type="button"
            onClick={() => scrollToSection(teamRef)}
            className="landing-header-btn"
          >
            Team
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero carbon-hero">
          <div className="landing-hero-left">
            <div className="landing-ai-badge">
              <Icon src={leafLogo} alt="Carbon Credit" size={17} />
              <span>Indian solar carbon credit prediction system</span>
            </div>

            <h1>
              Turn Solar Panels
              <br />
              <span>Into Carbon Credit Insights.</span>
            </h1>

            <p>
              SolarCarbon helps Indian solar users estimate possible carbon credits
              from solar panel electricity generation. The system uses location,
              panel area, and timeframe to estimate clean energy output, avoided
              CO₂ emissions, and carbon credits.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-primary-action"
                onClick={() => scrollToSection(calculatorRef)}
              >
                <Icon src={solarLogo} alt="Start" size={21} />
                <span>Calculate Credits</span>
                <Icon
                  src={arrowLogo}
                  alt="Arrow"
                  size={21}
                  className="landing-action-arrow"
                />
              </button>

              <button
                type="button"
                className="landing-secondary-action"
                onClick={() => scrollToSection(datasetRef)}
              >
                View Dataset Work
              </button>
            </div>

            <div className="landing-hero-trust-row">
              <TrustItem text="Indian thermal plant dataset" />
              <TrustItem text="Map-based location selection" />
              <TrustItem text="Solar energy to carbon credit report" />
            </div>
          </div>

          <div className="landing-hero-right">
            <div className="carbon-orbit-card">
              <div className="carbon-orbit-card-header">
                <div>
                  <span>Prediction Flow</span>
                  <h3>Solar → Energy → CO₂ → Credits</h3>
                </div>

                <div className="landing-dashboard-status">
                  <span></span>
                  {backendStatus === 'online' ? 'Live' : 'Checking'}
                </div>
              </div>

              <div className="carbon-core-circle">
                <Icon src={leafLogo} alt="Carbon" size={42} />
                <strong>1 Credit</strong>
                <span>= 1 ton CO₂ avoided</span>
              </div>

              <div className="carbon-pipeline-list">
                <InfoRow
                  title="Location"
                  text="Search address, click map, or type coordinates"
                  value="MAP"
                />

                <InfoRow
                  title="Solar Output"
                  text="Panel area and timeframe based clean energy estimate"
                  value="kWh"
                />

                <InfoRow
                  title="Carbon Report"
                  text="Credits, avoided emissions, and energy yield"
                  value="CO₂"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          ref={calculatorRef}
          id="calculator"
          className="carbon-calculator-section"
        >
          <div className="landing-section-heading">
            <span className="landing-section-label">Prediction Tool</span>

            <h2>Calculate your solar carbon credits</h2>

            <p>
              Select your solar project location on the map or manually enter
              latitude and longitude. Then enter panel area and timeframe to
              generate your estimated carbon credit report.
            </p>
          </div>

          <div className="calculator-split-card">
            <div className="calculator-map-card">
              <div className="calculator-card-head">
                <div>
                  <span className="panel-mini-label">Step 01</span>
                  <h3>Select project location</h3>
                </div>

                <Icon src={mapLogo} alt="Map" size={32} />
              </div>

              <p>
                Search your address or click any point on the map. Latitude and
                longitude will automatically appear in the text boxes on the
                right. You can also type them manually.
              </p>

              <div
                style={{
                  width: '100%',
                  height: '430px',
                  minHeight: '430px',
                  overflow: 'hidden',
                  borderRadius: '24px',
                  position: 'relative',
                  background: 'rgba(15, 23, 42, 0.65)',
                }}
              >
                <MapPicker
                  key={mapRenderKey}
                  lat={Number(formData.lat) || 28.61}
                  lon={Number(formData.lon) || 77.2}
                  onLocationSelect={handleMapLocationSelect}
                />
              </div>
            </div>

            <div className="calculator-details-card">
              <div className="calculator-card-head">
                <div>
                  <span className="panel-mini-label">Step 02</span>
                  <h3>Enter project details</h3>
                </div>

                <Icon src={calculatorLogo} alt="Calculator" size={32} />
              </div>

              <div
                style={{
                  marginTop: '16px',
                  marginBottom: '18px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  ...getStatusBoxStyle(),
                }}
              >
                {backendStatusMessage}
              </div>

              <div className="manual-input-stack">
                <div className="field">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.lat}
                    onChange={(e) => handleNumberChange('lat', e.target.value)}
                    placeholder="Enter latitude"
                  />
                </div>

                <div className="field">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.lon}
                    onChange={(e) => handleNumberChange('lon', e.target.value)}
                    placeholder="Enter longitude"
                  />
                </div>

                <div className="field">
                  <label>Panel Area in m²</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleNumberChange('area', e.target.value)}
                    placeholder="Enter panel area"
                  />
                </div>

                <div className="field">
                  <label>Prediction Timeframe</label>

                  <div className="select-wrapper">
                    <select
                      value={formData.days}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          days: parseInt(e.target.value),
                        });

                        setBackendError('');
                      }}
                    >
                      <optgroup label="Short Term">
                        {Array.from({ length: 11 }, (_, i) => i + 1).map(
                          (month) => (
                            <option key={`m-${month}`} value={month * 30}>
                              {month} Month{month > 1 ? 's' : ''}
                            </option>
                          )
                        )}
                      </optgroup>

                      <optgroup label="Long Term">
                        {Array.from({ length: 25 }, (_, i) => i + 1).map(
                          (year) => (
                            <option key={`y-${year}`} value={year * 365}>
                              {year} Year{year > 1 ? 's' : ''}
                            </option>
                          )
                        )}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              <button
                className="calc-btn"
                onClick={calculate}
                disabled={loading || backendStatus === 'offline'}
                style={{
                  opacity: loading || backendStatus === 'offline' ? 0.7 : 1,
                  cursor:
                    loading || backendStatus === 'offline'
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {loading ? 'Analyzing...' : 'Generate Credit Report'}
              </button>

              {backendError && (
                <div
                  className="backend-error-box"
                  style={{
                    marginTop: '18px',
                    padding: '16px 18px',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#fecaca',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  {backendError}
                </div>
              )}

              {result && !backendError && (
                <div className="results-panel">
                  <div className="credit-hero">
                    <span className="result-label">Estimated Carbon Assets</span>
                    <h3>{result.carbon_credits} Credits</h3>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Avoided Emissions</div>
                      <div className="stat-val">{result.co2_avoided_kg} kg</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-label">Energy Yield</div>
                      <div className="stat-val">{result.total_yield_kwh} kWh</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section ref={datasetRef} id="dataset" className="landing-detail-section">
          <div className="landing-detail-content">
            <div className="landing-detail-text">
              <span className="landing-section-label">Dataset Work</span>

              <h2>Custom dataset created for Indian carbon credit estimation</h2>

              <p>
                The project is based on a research-oriented dataset prepared for
                Indian thermal power plant emission analysis and solar-based carbon
                credit estimation. The dataset connects power generation, coal usage,
                CO₂ emission behaviour, location information, and solar credit
                calculation requirements.
              </p>

              <div className="landing-detail-points">
                <DetailPoint
                  icon={databaseLogo}
                  title="Indian power-sector data foundation"
                  text="The dataset was prepared around Indian thermal power plant records and electricity-generation behaviour."
                />

                <DetailPoint
                  icon={shieldLogo}
                  title="Verified project dataset"
                  text="The final dataset was refined, cleaned, checked, and structured before being used in the prediction flow."
                />

                <DetailPoint
                  icon={mapLogo}
                  title="Location-aware estimation"
                  text="Geographical information helps connect a user-selected solar location with regional emission estimation logic."
                />
              </div>
            </div>

            <div className="dataset-proof-card">
              <div className="dataset-proof-header">
                <Icon src={shieldLogo} alt="Dataset" size={42} />
                <span>Research Foundation</span>
              </div>

              <h3>Dataset & project foundation</h3>

              <div className="dataset-proof-list">
                <ResearchInfoItem
                  title="Data foundation"
                  text="Built around Indian thermal power plant and solar-energy estimation requirements."
                />

                <ResearchInfoItem
                  title="Project purpose"
                  text="Designed to estimate solar-based carbon credits for Indian users in a simple and accessible way."
                />

                <ResearchInfoItem
                  title="System output"
                  text="Shows estimated carbon credits, avoided CO₂ emissions, and total solar energy yield."
                />

                <ResearchInfoItem
                  title="User experience"
                  text="Users can select location, manually edit coordinates, enter panel area, choose timeframe, and generate the report."
                />
              </div>
            </div>
          </div>
        </section>

        <section
          ref={workflowRef}
          id="workflow"
          className="landing-workflow-section"
        >
          <div className="landing-section-heading">
            <span className="landing-section-label">System Workflow</span>

            <h2>How the prediction flow works</h2>

            <p>
              The system takes user location and solar panel details, estimates
              clean energy output, calculates avoided emissions, and converts the
              avoided CO₂ into carbon credits.
            </p>
          </div>

          <div className="landing-workflow-grid">
            <WorkflowCard
              number="01"
              icon={mapLogo}
              title="Select location"
              description="User searches an address, clicks on map, or manually types latitude and longitude."
            />

            <WorkflowCard
              number="02"
              icon={solarLogo}
              title="Enter panel area"
              description="User enters the total solar panel area in square meters."
            />

            <WorkflowCard
              number="03"
              icon={satelliteLogo}
              title="Choose timeframe"
              description="User selects monthly or yearly duration for prediction."
            />

            <WorkflowCard
              number="04"
              icon={leafLogo}
              title="Generate credits"
              description="Avoided emissions are converted into estimated carbon credits and shown in a report."
            />
          </div>
        </section>

        <section ref={marketRef} id="market" className="landing-detail-section">
          <div className="landing-detail-content">
            <div className="landing-detail-text">
              <span className="landing-section-label">Indian Market Use Cases</span>

              <h2>Useful for rooftop, campus, industrial, and solar farm projects</h2>

              <p>
                This system is designed for Indian solar users who want to
                understand their environmental contribution and possible carbon
                credit potential. It can support early-stage project reports,
                sustainability dashboards, and clean energy awareness.
              </p>

              <div className="landing-detail-points">
                <DetailPoint
                  icon={homeLogo}
                  title="Residential Rooftop Solar"
                  text="For homeowners who want to estimate how much CO₂ their rooftop solar setup can avoid."
                />

                <DetailPoint
                  icon={buildingLogo}
                  title="College and Campus Solar"
                  text="For institutions preparing sustainability reports or estimating green energy impact."
                />

                <DetailPoint
                  icon={factoryLogo}
                  title="Industrial and MSME Solar"
                  text="For factories and commercial users exploring clean energy and carbon credit opportunities."
                />
              </div>
            </div>

            <div className="indian-market-card">
              <div className="market-ring">
                <Icon src={leafLogo} alt="India Solar" size={44} />
                <strong>India</strong>
                <span>Solar Credit Focus</span>
              </div>

              <div className="market-mini-list">
                <div>
                  <span>Input</span>
                  <strong>Location + Panel Area</strong>
                </div>

                <div>
                  <span>Process</span>
                  <strong>Solar Energy + Emission Data</strong>
                </div>

                <div>
                  <span>Output</span>
                  <strong>Credits + CO₂ + kWh</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer ref={teamRef} id="team" className="landing-footer">
        <div className="landing-footer-content carbon-team-footer">
          <div className="landing-footer-brand">
            <button
              type="button"
              className="landing-footer-logo"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="landing-logo-icon">
                <Icon src={solarLogo} alt="SolarCarbon" size={20} />
              </div>

              <span>SolarCarbon</span>
            </button>

            <p>
              Carbon Credits Selling and Buying Prediction project for estimating
              solar-panel-based carbon credits using dataset engineering, solar
              energy estimation, validation, and clean energy impact calculation.
            </p>
          </div>

          <TeamMember
            name="Aritra Pradhan"
            role="ML Model Development, Backend Integration, Carbon Credit Logic, Mathematical Formulations"
            github="https://github.com/AR2706"
            linkedin="https://www.linkedin.com/in/aritra-pradhan-dev/"
          />

          <TeamMember
            name="Satvik Sharma"
            role="ML Model Development, Coordinate Verification, Feature Engineering , Frontend"
            github="https://github.com/Satvik-Sharma511"
            linkedin="https://www.linkedin.com/in/satvik-sharma-a3132128a/"
          />

          <TeamMember
            name="Sparsh Srivastava"
            role="Complete Dataset Development, Dataset Integration, Data Cleaning, Outlier Removal, Feature Analysis"
            github="https://github.com/Sp-bit-code"
            linkedin="https://www.linkedin.com/in/sparsh-srivastava-621882289/"
          />

          <TeamMember
            name="Harsh Kumar Nimesh"
            role="Dataset Validation, NASA POWER API Logic, Solar Energy Estimation, Mathematical Calculations"
            github="https://github.com/HarshKN721"
            linkedin="https://www.linkedin.com/in/harsh-kumar-nimesh?skipRedirect=true&miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAAEUOibcBmK3NByC0NVEDBM9nbZaOtyt1gQQ"
          />
        </div>

        <div className="landing-footer-bottom">
          <p>
            © 2026 SolarCarbon. Built for Indian solar impact and carbon credit prediction.
            <span> Solar | Dataset | Validation | CO₂ | Credits</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Icon({ src, alt = '', size = 18, className = '' }) {
  return (
    <span
      className={`landing-text-icon ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
      }}
      aria-hidden="true"
    >
      <img src={src} alt={alt} />
    </span>
  );
}

function TrustItem({ text }) {
  return (
    <div className="landing-trust-item">
      <Icon src={checkLogo} alt="Check" size={18} />
      <span>{text}</span>
    </div>
  );
}

function InfoRow({ title, text, value }) {
  return (
    <div className="landing-score-item">
      <div>
        <span>{title}</span>
        <small>{text}</small>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function DetailPoint({ icon, title, text }) {
  return (
    <div className="landing-detail-point">
      <div className="landing-detail-point-icon">
        <Icon src={icon} alt={title} size={24} />
      </div>

      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}

function WorkflowCard({ number, icon, title, description }) {
  return (
    <div className="landing-workflow-card">
      <div className="landing-workflow-card-top">
        <span>{number}</span>

        <div className="landing-workflow-icon">
          <Icon src={icon} alt={title} size={28} />
        </div>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function ResearchInfoItem({ title, text }) {
  return (
    <div className="proof-item">
      <Icon src={checkLogo} alt="Check" size={18} />

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function TeamMember({ name, role, github, linkedin }) {
  return (
    <div className="team-member-card">
      <div className="team-avatar">
        {name
          .split(' ')
          .map((item) => item[0])
          .join('')
          .slice(0, 2)}
      </div>

      <div>
        <h3>{name}</h3>
        <p>{role}</p>

        <div className="team-socials">
          {github && (
            <a href={github} target="_blank" rel="noreferrer">
              <Icon src={githubLogo} alt="GitHub" size={18} />
              GitHub
            </a>
          )}

          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer">
              <Icon src={linkedinLogo} alt="LinkedIn" size={18} />
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
