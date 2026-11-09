const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const navigationLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");
const year = document.querySelector("#current-year");
const certificateDialog = document.querySelector("#certificate-dialog");
const certificateTriggers = document.querySelectorAll(".certificate-trigger");
const certificateClose = document.querySelector(".certificate-close");
const certificateDialogTitle = document.querySelector("#certificate-dialog-title");
const certificateFullImage = document.querySelector("#certificate-full-image");
const learnwellDialog = document.querySelector("#learnwell-dialog");
const learnwellPreviewButton = document.querySelector(".learnwell-preview-button");
const learnwellClose = document.querySelector(".learnwell-close");
const nssGalleryDialog = document.querySelector("#nss-gallery-dialog");
const nssGalleryTrigger = document.querySelector(".nss-gallery-link");
const nssGalleryClose = document.querySelector(".nss-gallery-close");
const nssGalleryPrevious = document.querySelector(".nss-gallery-previous");
const nssGalleryNext = document.querySelector(".nss-gallery-next");
const nssGalleryCount = document.querySelector(".nss-gallery-count");
const nssGalleryEmpty = document.querySelector(".nss-gallery-empty");
const nssGalleryImage = document.querySelector(".nss-gallery-image");
const nssGalleryGrid = document.querySelector(".nss-gallery-grid");
const nssGalleryStage = document.querySelector(".nss-gallery-stage");
const nssGalleryBack = document.querySelector(".nss-gallery-back");
const certificationDialog = document.querySelector("#certification-dialog");
const certificationTriggers = document.querySelectorAll(".certification-open");
const certificationTitle = document.querySelector("#certification-dialog-title");
const certificationImage = document.querySelector(".certification-document img");
const certificationClose = document.querySelector(".certification-close");
const nssPhotos = [
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.20.23 PM.jpeg",
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.20.24 PM.jpeg",
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.20.24 PM (1).jpeg",
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.20.24 PM (2).jpeg",
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.20.24 PM (3).jpeg",
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.20.24 PM (4).jpeg",
  "assets/Nss/WhatsApp Image 2026-11-09 at 12.47.38 PM.jpeg",
  "assets/Nss/photo_6251358495018432971_y.jpg",
];
let nssPhotoIndex = 0;

if (year) year.textContent = new Date().getFullYear();

if (
  certificateDialog instanceof HTMLDialogElement &&
  certificateTriggers.length &&
  certificateClose &&
  certificateDialogTitle &&
  certificateFullImage instanceof HTMLImageElement
) {
  certificateTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const certificateTitle = trigger.dataset.certificateTitle;
      const certificateSrc = trigger.dataset.certificateSrc;
      const certificateAlt = trigger.dataset.certificateAlt;
      if (!certificateTitle || !certificateSrc || !certificateAlt) return;
      certificateDialogTitle.textContent = certificateTitle;
      certificateFullImage.src = certificateSrc;
      certificateFullImage.alt = certificateAlt;
      certificateDialog.showModal();
    });
  });
  certificateClose.addEventListener("click", () => certificateDialog.close());
  certificateDialog.addEventListener("click", (event) => {
    if (event.target === certificateDialog) certificateDialog.close();
  });
}

if (
  learnwellDialog instanceof HTMLDialogElement &&
  learnwellPreviewButton &&
  learnwellClose
) {
  learnwellPreviewButton.addEventListener("click", () => learnwellDialog.showModal());
  learnwellClose.addEventListener("click", () => learnwellDialog.close());
  learnwellDialog.addEventListener("click", (event) => {
    if (event.target === learnwellDialog) learnwellDialog.close();
  });
}

if (
  nssGalleryDialog instanceof HTMLDialogElement &&
  nssGalleryTrigger &&
  nssGalleryClose &&
  nssGalleryPrevious instanceof HTMLButtonElement &&
  nssGalleryNext instanceof HTMLButtonElement &&
  nssGalleryCount &&
  nssGalleryEmpty &&
  nssGalleryImage instanceof HTMLImageElement &&
  nssGalleryGrid &&
  nssGalleryStage &&
  nssGalleryBack instanceof HTMLButtonElement
) {
  const renderNssGallery = () => {
    const hasPhotos = nssPhotos.length > 0;
    nssGalleryGrid.replaceChildren();
    nssGalleryGrid.hidden = !hasPhotos;
    nssGalleryStage.hidden = hasPhotos;
    nssGalleryEmpty.hidden = hasPhotos;
    nssGalleryImage.hidden = true;
    nssGalleryBack.hidden = true;
    nssGalleryPrevious.hidden = true;
    nssGalleryNext.hidden = true;
    nssGalleryPrevious.disabled = true;
    nssGalleryNext.disabled = true;
    nssGalleryCount.textContent = hasPhotos ? `${nssPhotos.length} photographs` : "0 / 0";

    nssPhotos.forEach((photo, index) => {
      const button = document.createElement("button");
      const image = document.createElement("img");
      button.type = "button";
      button.className = "nss-gallery-thumbnail";
      button.setAttribute("aria-label", `View NSS photograph ${index + 1}`);
      image.src = photo;
      image.alt = `NSS photograph ${index + 1}`;
      image.loading = "lazy";
      button.append(image);
      button.addEventListener("click", () => showNssPhoto(index));
      nssGalleryGrid.append(button);
    });
  };

  const showNssPhoto = (index) => {
    nssPhotoIndex = index;
    nssGalleryGrid.hidden = true;
    nssGalleryStage.hidden = false;
    nssGalleryEmpty.hidden = true;
    nssGalleryImage.hidden = false;
    nssGalleryBack.hidden = false;
    nssGalleryPrevious.hidden = false;
    nssGalleryNext.hidden = false;
    nssGalleryPrevious.disabled = nssPhotos.length < 2;
    nssGalleryNext.disabled = nssPhotos.length < 2;
    nssGalleryCount.textContent = `${nssPhotoIndex + 1} / ${nssPhotos.length}`;
    nssGalleryImage.src = nssPhotos[nssPhotoIndex];
    nssGalleryImage.alt = `NSS photograph ${nssPhotoIndex + 1}`;
  };

  nssGalleryTrigger.addEventListener("click", () => {
    renderNssGallery();
    nssGalleryDialog.showModal();
  });
  nssGalleryClose.addEventListener("click", () => nssGalleryDialog.close());
  nssGalleryBack.addEventListener("click", renderNssGallery);
  nssGalleryPrevious.addEventListener("click", () => {
    if (nssPhotos.length < 2) return;
    showNssPhoto((nssPhotoIndex - 1 + nssPhotos.length) % nssPhotos.length);
  });
  nssGalleryNext.addEventListener("click", () => {
    if (nssPhotos.length < 2) return;
    showNssPhoto((nssPhotoIndex + 1) % nssPhotos.length);
  });
  nssGalleryDialog.addEventListener("click", (event) => {
    if (event.target === nssGalleryDialog) nssGalleryDialog.close();
  });
  renderNssGallery();
}

if (
  certificationDialog instanceof HTMLDialogElement &&
  certificationTriggers.length &&
  certificationTitle &&
  certificationImage instanceof HTMLImageElement &&
  certificationClose
) {
  certificationTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const title = trigger.dataset.certificationTitle;
      const source = trigger.dataset.certificationSrc;
      const alt = trigger.dataset.certificationAlt;
      if (!title || !source || !alt) return;
      certificationTitle.textContent = title;
      certificationImage.src = source;
      certificationImage.alt = alt;
      certificationDialog.showModal();
    });
  });
  certificationClose.addEventListener("click", () => certificationDialog.close());
  certificationDialog.addEventListener("click", (event) => {
    if (event.target === certificationDialog) certificationDialog.close();
  });
  certificationDialog.addEventListener("close", () => certificationImage.removeAttribute("src"));
}

function closeNavigation() {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigationLinks.forEach((link) => link.addEventListener("click", closeNavigation));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNavigation();
      if (certificateDialog instanceof HTMLDialogElement && certificateDialog.open) {
        certificateDialog.close();
      }
      if (learnwellDialog instanceof HTMLDialogElement && learnwellDialog.open) {
        learnwellDialog.close();
      }
      if (nssGalleryDialog instanceof HTMLDialogElement && nssGalleryDialog.open) {
        nssGalleryDialog.close();
      }
      if (certificationDialog instanceof HTMLDialogElement && certificationDialog.open) {
        certificationDialog.close();
      }
    }
  });
}

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navigationLinks.forEach((link) => {
          const isCurrent = link.hash === `#${entry.target.id}`;
          link.classList.toggle("is-active", isCurrent);
          if (isCurrent) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-25% 0px -65% 0px" },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
