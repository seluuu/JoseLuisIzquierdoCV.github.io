/*
 * script.js - Lógica Modular para Portfolio Dinámico
 *
 * Estructura:
 * 1. utils.js (Formateo de fechas, truncado, etc.)
 * 2. dataLoader.js (Fetch, validación)
 * 3. renderer.js (Templating, inyección en el DOM)
 * 4. main.js (Inicialización y lógica de tema)
 */

const utils = (() => {
    /**
     * Formatea una fecha ISO (YYYY-MM-DD) a un formato legible (e.g., "Octubre 2023").
     * @param {string | null} dateString - La fecha en formato ISO. Si es null, devuelve "Actualidad".
     * @returns {string} La fecha formateada.
     */
    const formatDate = (dateString) => {
        if (!dateString) return "Actualidad";
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    };

    /**
     * Crea un elemento <time> accesible.
     * @param {string} dateString - La fecha en formato ISO.
     * @returns {string} El HTML del elemento <time>.
     */
    const createTimeTag = (dateString) => {
        if (!dateString) return '';
        const formattedDate = formatDate(dateString);
        return `<time datetime="${dateString}">${formattedDate}</time>`;
    };

    /**
     * Trunca un texto de forma segura.
     * @param {string} text - El texto a truncar.
     * @param {number} maxLength - Longitud máxima.
     * @returns {string} El texto truncado.
     */
    const safeTruncate = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    /**
     * Genera el JSON-LD para SEO.
     * @param {object} personalData - Datos personales.
     * @returns {object} Objeto JSON-LD.
     */
    const generateJsonLd = (personalData) => {
        const sameAsUrls = personalData.social.map(s => s.url);
        return {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": personalData.name,
            "jobTitle": personalData.title,
            "url": window.location.href,
            "email": personalData.email,
            "image": personalData.photo,
            "sameAs": sameAsUrls
        };
    };

    return {
        formatDate,
        createTimeTag,
        safeTruncate,
        generateJsonLd
    };
})();

const dataLoader = (() => {
    const DATA_PATH = 'data.json';

    /**
     * Realiza el fetch de data.json y valida la estructura básica.
     * @returns {Promise<object>} Los datos del portfolio.
     */
    const loadData = async () => {
        try {
            const response = await fetch(DATA_PATH);
            if (!response.ok) {
                throw new Error(`Error al cargar ${DATA_PATH}: ${response.statusText}`);
            }
            const data = await response.json();
            validateData(data);
            return data;
        } catch (error) {
            console.error("Fallo en la carga o validación de datos:", error);
            document.body.innerHTML = '<p style="text-align: center; padding: 50px;">Error al cargar el portfolio. Por favor, revisa el archivo data.json.</p>';
            return null;
        }
    };

    /**
     * Validación básica de la estructura de datos.
     * @param {object} data - Los datos cargados.
     */
    const validateData = (data) => {
        if (!data.personal || !data.skills || !data.experience) {
            throw new Error("Estructura de data.json incompleta. Faltan secciones clave (personal, skills, experience).");
        }
    };

    return {
        loadData
    };
})();

const renderer = ((utils) => {
    /**
     * Genera el HTML para un tag/badge.
     * @param {string} text - Texto del tag.
     * @returns {string} HTML del tag.
     */
    const renderTag = (text) => `<span class="tag">${text}</span>`;

    /**
     * Renderiza la sección de información personal (Header y About).
     * @param {object} data - Datos personales.
     */
    const renderPersonal = (data) => {
        const header = document.getElementById('main-header');
        header.innerHTML = `
            <img src="${data.photo}" alt="Foto de perfil de ${data.name}" class="profile__photo" loading="lazy">
            <h1 class="profile__name">${data.name}</h1>
            <p class="profile__title">${data.title}</p>
        `;

        const aboutContent = document.getElementById('about-content');
        aboutContent.innerHTML = `<p>${data.about}</p>`;

        const contactInfo = document.getElementById('contact-info');
        contactInfo.innerHTML = data.social.map(s => `
            <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="${s.name}">
                <!-- Icono simulado. En un proyecto real se usaría SVG o una librería de iconos -->
                <span aria-hidden="true">${s.icon.charAt(0).toUpperCase()}</span> ${s.name}
            </a>
        `).join('');

        contactInfo.innerHTML += `
            <a href="mailto:${data.email}" class="social-link" aria-label="Enviar correo electrónico a ${data.name}">
                <span aria-hidden="true">✉️</span> Email
            </a>
        `;

        const jsonLdScript = document.getElementById('json-ld-data');
        jsonLdScript.textContent = JSON.stringify(utils.generateJsonLd(data));
    };

    /**
     * Renderiza la sección de habilidades.
     * @param {Array<object>} skills - Lista de habilidades.
     */
    const renderSkills = (skills) => {
        const skillsContent = document.getElementById('skills-content');
        skillsContent.innerHTML = skills.map(category => `
            <div class="card skills__category" role="group" aria-labelledby="skill-cat-${category.category}">
                <h3 id="skill-cat-${category.category}" class="card__title">${category.category}</h3>
                <div class="skills__category-list">
                    ${category.items.map(renderTag).join('')}
                </div>
            </div>
        `).join('');
    };

    /**
     * Renderiza la sección de experiencia laboral (Timeline).
     * @param {Array<object>} experience - Lista de experiencias.
     */
    const renderExperience = (experience) => {
        const timeline = document.getElementById('experience-timeline');
        timeline.innerHTML = experience.map((job, index) => {
            const sideClass = index % 2 === 0 ? '' : 'timeline__item--right';
            const startDate = utils.createTimeTag(job.startDate);
            const endDate = job.endDate ? utils.createTimeTag(job.endDate) : 'Actualidad';

            return `
                <div class="timeline__item ${sideClass}" role="listitem">
                    <div class="timeline__content card">
                        <h3 class="card__title">${job.title}</h3>
                        <p class="card__subtitle">${job.company} - ${job.location}</p>
                        <p class="timeline__date">${startDate} - ${endDate}</p>
                        <p>${job.description}</p>
                        <div class="tags-container" aria-label="Tecnologías utiliBzadas">
                            ${job.tags.map(renderTag).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    /**
     * Renderiza la sección de certificaciones (Cards).
     * @param {Array<object>} certifications - Lista de certificaciones.
     */
    const renderCertifications = (certifications) => {
        const cards = document.getElementById('certifications-cards');
        cards.innerHTML = certifications.map(cert => `
            <a href="${cert.url}" target="_blank" rel="noopener noreferrer" class="card" role="listitem">
                <h3 class="card__title">${cert.name}</h3>
                <p class="card__subtitle">${cert.issuer}</p>
                <p class="timeline__date">${utils.createTimeTag(cert.date)}</p>
            </a>
        `).join('');
    };

    /**
     * Renderiza la sección de formaciones y charlas (Events).
     * @param {Array<object>} events - Lista de eventos.
     */
    const renderEvents = (events) => {
        const list = document.getElementById('events-list');
        list.innerHTML = events.map(event => `
            <div class="list-item" role="listitem">
                <div class="list-item__header">
                    <h4 class="list-item__title">
                        <a href="${event.url}" target="_blank" rel="noopener noreferrer">${event.title}</a>
                    </h4>
                    <p class="list-item__date">${utils.createTimeTag(event.date)}</p>
                </div>
                <p class="list-item__subtitle">${event.type} en ${event.location}</p>
            </div>
        `).join('');
    };

    /**
     * Renderiza la sección de formación académica.
     * @param {Array<object>} academic - Lista de formación académica.
     */
    const renderAcademic = (academic) => {
        const list = document.getElementById('academic-list');
        list.innerHTML = academic.map(item => {
            const startDate = utils.createTimeTag(item.startDate);
            const endDate = utils.createTimeTag(item.endDate);
            return `
                <div class="list-item" role="listitem">
                    <div class="list-item__header">
                        <h4 class="list-item__title">${item.degree}</h4>
                        <p class="list-item__date">${startDate} - ${endDate}</p>
                    </div>
                    <p class="list-item__subtitle">${item.institution}</p>
                </div>
            `;
        }).join('');
    };

    /**
     * Renderiza el formulario de contacto simulado.
     * @param {object} personalData - Datos personales para el mailto.
     */
    const renderContactForm = (personalData) => {
        const form = document.getElementById('contact-form');
        form.innerHTML = `
            <div class="form-group">
                <label for="name">Tu Nombre:</label>
                <input type="text" id="name" name="name" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="email">Tu Email:</label>
                <input type="email" id="email" name="email" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="subject">Asunto:</label>
                <input type="text" id="subject" name="subject" required aria-required="true" value="Consulta de Portfolio">
            </div>
            <div class="form-group">
                <label for="message">Mensaje:</label>
                <textarea id="message" name="message" required aria-required="true"></textarea>
            </div>
            <!-- Honeypot: Campo oculto para bots -->
            <div class="honeypot">
                <label for="fax">No rellenar:</label>
                <input type="text" id="fax" name="fax" tabindex="-1" autocomplete="off">
            </div>
            <button type="submit" class="button">Enviar Mensaje (Simulado)</button>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const honeypotField = document.getElementById('fax');
            if (honeypotField.value) {
                console.warn("Intento de spam detectado (honeypot).");
                alert("Mensaje enviado (simulación). Gracias por tu interés.");
                form.reset();
                return;
            }

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            const mailtoSubject = encodeURIComponent(`[Portfolio] ${subject}`);
            const mailtoBody = encodeURIComponent(`Hola ${personalData.name},\n\nMi nombre es ${name} (${email}).\n\n${message}\n\nSaludos.`);
            const mailtoLink = `mailto:${personalData.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

            window.location.href = mailtoLink;

            form.reset();
        });
    };

    /**
     * Función principal de renderizado.
     * @param {object} data - Los datos del portfolio.
     */
    const renderAll = (data) => {
        renderPersonal(data.personal);
        renderSkills(data.skills);
        renderExperience(data.experience);
        renderCertifications(data.certifications);
        renderEvents(data.events);
        renderAcademic(data.academic);
        renderContactForm(data.personal);
    };

    return {
        renderAll
    };
})(utils); 

document.addEventListener('DOMContentLoaded', async () => {
    const data = await dataLoader.loadData();
    if (data) {
        renderer.renderAll(data);
    }

    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeSwitch.setAttribute('aria-checked', 'true');
            themeSwitch.title = 'Cambiar a tema claro';
        } else {
            body.classList.remove('dark-mode');
            themeSwitch.setAttribute('aria-checked', 'false');
            themeSwitch.title = 'Cambiar a tema oscuro';
        }
        localStorage.setItem('theme', theme);
    };

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    themeSwitch.addEventListener('click', () => {
        const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    themeSwitch.setAttribute('role', 'switch');
});