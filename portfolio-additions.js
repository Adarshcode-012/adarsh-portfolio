"use strict";

const projectList = document.getElementById("mini-project-list");
const projectEmpty = document.getElementById("mini-project-empty");
const certificateDialog = document.getElementById("certificate-dialog");

async function loadMiniProjects() {
  try {
    const response = await fetch("./mini-projects.json");
    if (!response.ok) return;
    const projects = await response.json();
    if (!Array.isArray(projects)) return;
    for (const item of projects) {
      if (!item || typeof item.title !== "string" || !item.title.trim()) continue;
      const card = document.createElement("article");
      card.className = "project compact mini-project";
      const heading = document.createElement("h3");
      heading.textContent = item.title;
      card.append(heading);
      if (Array.isArray(item.tags) && item.tags.some(tag => typeof tag === "string" && tag.trim())) {
        const tech = document.createElement("p");
        tech.className = "tech";
        tech.textContent = item.tags.filter(tag => typeof tag === "string" && tag.trim()).join(" · ");
        card.append(tech);
      }
      if (typeof item.description === "string" && item.description.trim()) {
        const description = document.createElement("p");
        description.textContent = item.description;
        card.append(description);
      }
      const links = document.createElement("div");
      links.className = "mini-project-links";
      for (const [label, url] of [["Live demo", item.demo], ["Source code", item.source]]) {
        if (typeof url !== "string" || !URL.canParse(url)) continue;
        const address = new URL(url);
        if (address.protocol !== "https:" && address.protocol !== "http:") continue;
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = address.href;
        link.textContent = label;
        links.append(link);
      }
      if (links.childElementCount) card.append(links);
      projectList.append(card);
    }
    projectEmpty.hidden = Boolean(projectList.childElementCount);
  } catch (error) {
    console.warn("Mini projects could not be loaded.", error);
  }
}

for (const link of document.querySelectorAll("[data-certificate]")) {
  link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof certificateDialog.showModal !== "function") return;
    event.preventDefault();
    const title = link.dataset.title || link.textContent.trim();
    const certificate = document.getElementById("certificate-image");
    document.getElementById("certificate-title").textContent = title;
    document.getElementById("certificate-original").href = link.href;
    certificate.alt = title + " certificate";
    certificate.src = link.href;
    certificateDialog.showModal();
  });
}

loadMiniProjects();
