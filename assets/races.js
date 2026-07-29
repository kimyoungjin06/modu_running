(() => {
    const DAY = 86400000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = value => {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    };
    const daysUntil = value => Math.ceil((parseDate(value) - today) / DAY);
    const formatDate = value => new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short"
    }).format(parseDate(value));
    const formatShortDate = value => value.replaceAll("-", ".");
    const courseLabel = course => course === "full" ? "FULL" : course === "half" ? "HALF" : course.toUpperCase();
    const courseBadges = race => race.courses
        .filter(course => ["full", "half", "10km"].includes(course))
        .map(course => `<span>${courseLabel(course)}</span>`).join("");
    const registrationState = race => {
        const open = daysUntil(race.registrationOpen);
        const close = daysUntil(race.registrationClose);
        if (open > 0) return { label: `접수 D-${open}`, className: "is-before" };
        if (close >= 0) return { label: close === 0 ? "오늘 마감" : `접수중 · D-${close}`, className: "is-open" };
        return { label: "접수 마감", className: "is-closed" };
    };
    const safe = value => String(value || "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));

    const raceCard = (race, compact = false, registrationFocus = false) => {
        const state = registrationState(race);
        const dDay = daysUntil(race.raceDate);
        return `<article class="race-card${compact ? " is-compact" : ""}">
            <div class="race-card-top">
                <time datetime="${registrationFocus ? race.registrationOpen : race.raceDate}">${registrationFocus ? `접수 ${formatShortDate(race.registrationOpen)}` : formatDate(race.raceDate)}</time>
                <span class="race-status ${state.className}">${state.label}</span>
            </div>
            <h3>${safe(race.name)}</h3>
            <p>${safe(race.region)} · ${safe(race.place)}</p>
            <div class="race-card-bottom">
                <div class="race-courses">${courseBadges(race)}</div>
                <strong>${dDay === 0 ? "D-DAY" : `D-${dDay}`}</strong>
            </div>
            <a href="${safe(race.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${safe(race.name)} 마라톤GO에서 보기"></a>
        </article>`;
    };

    const loadData = async () => {
        const [raceResponse, featuredResponse] = await Promise.all([
            fetch("data/races.json"),
            fetch("data/featured-races.json")
        ]);
        if (!raceResponse.ok || !featuredResponse.ok) throw new Error("대회 데이터를 불러오지 못했습니다.");
        const raceData = await raceResponse.json();
        const featuredData = await featuredResponse.json();
        return { raceData, featuredData };
    };

    const renderHome = ({ raceData, featuredData }) => {
        const registrationElement = document.getElementById("registration-races");
        if (!registrationElement) return;
        const upcomingRaces = raceData.races.filter(race => daysUntil(race.raceDate) >= 0);
        const registration = upcomingRaces
            .filter(race => daysUntil(race.registrationOpen) >= 0)
            .sort((a, b) => a.registrationOpen.localeCompare(b.registrationOpen))
            .slice(0, 3);
        const withinFourWeeks = upcomingRaces
            .filter(race => daysUntil(race.raceDate) <= 28)
            .sort((a, b) => a.raceDate.localeCompare(b.raceDate))
            .slice(0, 4);
        const byId = new Map(raceData.races.map(race => [race.id, race]));
        const featured = featuredData.raceIds.map(id => byId.get(id))
            .filter(race => race && daysUntil(race.raceDate) >= 0)
            .sort((a, b) => a.raceDate.localeCompare(b.raceDate))
            .slice(0, 3);

        registrationElement.innerHTML = registration.length
            ? registration.map(race => raceCard(race, true, true)).join("")
            : "<p class=\"race-empty\">예정된 접수 일정이 없습니다.</p>";
        document.getElementById("four-week-races").innerHTML = withinFourWeeks.length
            ? withinFourWeeks.map(race => raceCard(race, true)).join("")
            : "<p class=\"race-empty\">4주 안에 예정된 10K·하프·풀 대회가 없습니다.</p>";
        document.getElementById("featured-races").innerHTML = featured.length
            ? featured.map(race => raceCard(race, true)).join("")
            : "<p class=\"race-empty\">등록된 주요 대회가 없습니다.</p>";
        const retrieved = raceData.source.retrievedAt.slice(0, 10).replaceAll("-", ".");
        document.getElementById("race-source-date").textContent = `최종 갱신 ${retrieved}`;
    };

    const renderCalendar = ({ raceData }) => {
        const list = document.getElementById("race-calendar-list");
        if (!list) return;
        const courseFilter = document.getElementById("race-course-filter");
        const regionFilter = document.getElementById("race-region-filter");
        const statusFilter = document.getElementById("race-status-filter");
        const searchInput = document.getElementById("race-search");
        const count = document.getElementById("race-result-count");
        const pagerControls = document.getElementById("race-pager-controls");
        const pageDots = document.getElementById("race-page-dots");
        const previousButton = document.getElementById("race-page-prev");
        const nextButton = document.getElementById("race-page-next");
        const upcoming = raceData.races.filter(race => daysUntil(race.raceDate) >= 0);
        let filteredRaces = [];
        let currentPage = 0;
        let pageSize = window.matchMedia("(max-width: 620px)").matches ? 3 : 6;

        [...new Set(upcoming.map(race => race.region))].sort().forEach(region => {
            regionFilter.insertAdjacentHTML("beforeend", `<option value="${safe(region)}">${safe(region)}</option>`);
        });

        const setPage = (page, behavior = "smooth") => {
            const pages = Array.from(list.querySelectorAll(".race-page"));
            if (!pages.length) return;
            currentPage = Math.max(0, Math.min(page, pages.length - 1));
            pages[currentPage].scrollIntoView({ behavior, block: "nearest", inline: "start" });
            previousButton.disabled = currentPage === 0;
            nextButton.disabled = currentPage === pages.length - 1;
            Array.from(pageDots.children).forEach((dot, index) => {
                dot.classList.toggle("is-active", index === currentPage);
                dot.setAttribute("aria-current", index === currentPage ? "page" : "false");
            });
        };

        const renderPages = () => {
            const pageCount = Math.ceil(filteredRaces.length / pageSize);
            count.textContent = `${filteredRaces.length}개 대회 · ${pageCount || 0}페이지`;
            if (!filteredRaces.length) {
                list.innerHTML = "<p class=\"race-empty\">조건에 맞는 대회가 없습니다.</p>";
                pagerControls.hidden = true;
                return;
            }
            list.innerHTML = Array.from({ length: pageCount }, (_, pageIndex) => {
                const pageRaces = filteredRaces.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
                return `<section class="race-page" aria-label="${pageIndex + 1}페이지">${pageRaces.map(race => raceCard(race)).join("")}</section>`;
            }).join("");
            pageDots.innerHTML = Array.from({ length: pageCount }, (_, index) =>
                `<button type="button" aria-label="${index + 1}페이지로 이동" data-page="${index}"></button>`
            ).join("");
            pagerControls.hidden = pageCount <= 1;
            currentPage = 0;
            requestAnimationFrame(() => setPage(0, "auto"));
        };

        const update = () => {
            const keyword = searchInput.value.trim().toLowerCase();
            filteredRaces = upcoming.filter(race => {
                const courseMatches = courseFilter.value === "all" || race.courses.includes(courseFilter.value);
                const regionMatches = regionFilter.value === "all" || race.region === regionFilter.value;
                const state = registrationState(race);
                const statusMatches = statusFilter.value === "all"
                    || (statusFilter.value === "before" && state.className === "is-before")
                    || (statusFilter.value === "open" && state.className === "is-open");
                return courseMatches && regionMatches && statusMatches
                    && (!keyword || `${race.name} ${race.place} ${race.host}`.toLowerCase().includes(keyword));
            });
            renderPages();
        };
        [courseFilter, regionFilter, statusFilter].forEach(element => element.addEventListener("change", update));
        searchInput.addEventListener("input", update);
        previousButton.addEventListener("click", () => setPage(currentPage - 1));
        nextButton.addEventListener("click", () => setPage(currentPage + 1));
        pageDots.addEventListener("click", event => {
            const button = event.target.closest("[data-page]");
            if (button) setPage(Number(button.dataset.page));
        });
        list.addEventListener("scroll", () => {
            const width = list.clientWidth;
            if (!width) return;
            const page = Math.round(list.scrollLeft / width);
            if (page !== currentPage) {
                currentPage = page;
                previousButton.disabled = currentPage === 0;
                nextButton.disabled = currentPage >= list.children.length - 1;
                Array.from(pageDots.children).forEach((dot, index) => {
                    dot.classList.toggle("is-active", index === currentPage);
                    dot.setAttribute("aria-current", index === currentPage ? "page" : "false");
                });
            }
        }, { passive: true });
        window.addEventListener("resize", () => {
            const nextPageSize = window.matchMedia("(max-width: 620px)").matches ? 3 : 6;
            if (nextPageSize !== pageSize) {
                pageSize = nextPageSize;
                renderPages();
            }
        });
        document.getElementById("calendar-source-date").textContent = raceData.source.retrievedAt.slice(0, 10).replaceAll("-", ".");
        update();
    };

    loadData().then(data => {
        renderHome(data);
        renderCalendar(data);
    }).catch(error => {
        document.querySelectorAll("[data-race-loading]").forEach(element => {
            element.innerHTML = `<p class="race-empty">${safe(error.message)}</p>`;
        });
    });
})();
