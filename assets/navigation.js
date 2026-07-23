(() => {
    const header = document.querySelector("[data-site-header]");
    const toggle = document.querySelector(".menu-toggle");
    const navigation = document.getElementById("site-navigation");

    if (!header || !toggle || !navigation) {
        return;
    }

    const closeMenu = () => {
        header.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector(".sr-only").textContent = "메뉴 열기";
    };

    toggle.addEventListener("click", () => {
        const isOpen = header.classList.toggle("menu-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.querySelector(".sr-only").textContent = isOpen ? "메뉴 닫기" : "메뉴 열기";
    });

    navigation.addEventListener("click", event => {
        if (event.target.closest("a")) {
            closeMenu();
        }
    });

    document.addEventListener("click", event => {
        if (!header.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();
            toggle.focus();
        }
    });

    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
})();
