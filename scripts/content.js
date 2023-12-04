class Observer {
    // According to UI updates these classes might be changed by otvet.mail.ru
    #classes = {
        mainCentralContainer: ".gIgDu",
        questionsContainer: ".Ukx7k",
        answersContainer: [".RIsA6", ".qIJY9"], // (first one is main to questions where the best answer was already selected or question is already on voting)
        commentsContainer: ".hVFZ2",
        question: ".wjjeg",
        answer: ".cxc3c",
        comment: ".vGRgR",
        mainNameContainerElement: ".XU1kw",
        userAnswerName: ".QBqbi",
        userQuestionName: ".sLn02",
    };

    constructor() {
        this._ignoreList = JSON.parse(localStorage.getItem("ignoreList")) || [];
    }

    #body = document.querySelector(this.#classes.mainCentralContainer);
    #currentUserLink = document.querySelector("a.nbO8x[title*='Профиль']")
        ?.href;

    _observe() {
        let observer = new MutationObserver(() => this.#runOnMutation());
        observer.observe(this.#body, {
            childList: true,
            subtree: true,
        });
    }

    #runOnMutation() {
        let mainSectionContainers = this.#getMainSectionContainers();

        const availableContainerNames = this.#getAvailableContainersNames(
            mainSectionContainers
        );

        if (!availableContainerNames.length) return;

        availableContainerNames.forEach(containerName => {
            let containedElements = this.#getContainedElements(
                containerName,
                mainSectionContainers
            );

            if (!containedElements.length) return;

            this.#appendIgnoreLinkElements(containedElements);
            this.#filterContainedElements(containedElements);
        });
    }

    #getMainSectionContainers() {
        return {
            questionsContainer: document.querySelector(
                this.#classes.questionsContainer
            ),
            answersContainer:
                document.querySelector(this.#classes.answersContainer[0]) ||
                document.querySelector(this.#classes.answersContainer[1]),
            commentsContainer: document.querySelector(
                this.#classes.commentsContainer
            ),
        };
    }
    #getAvailableContainersNames(sections) {
        const containerNames = Object.keys(sections).filter(
            section => sections[section] !== null
        );
        return containerNames;
    }

    #getContainedElements(containerName, mainSections) {
        let container = mainSections[containerName];
        let containerType = containerName.split("sContainer")[0];
        let containedElements = Array.from(
            container.querySelectorAll(this.#classes[containerType])
        );

        return containedElements;
    }

    #getUserLinkElem(node) {
        return node.querySelector("a[href*='/id']");
    }

    #addToIgnoreList(node, linkElem) {
        let listOfUserUrls = this._ignoreList.map(user => user.url);
        if (listOfUserUrls.includes(linkElem.href)) return;

        this._ignoreList.push({
            url: linkElem.href,
            name:
                linkElem
                    .closest(this.#classes.mainNameContainerElement)
                    ?.querySelector(`a${this.#classes.userAnswerName}`)
                    ?.innerText ||
                node.querySelector(`a${this.#classes.userQuestionName}`)
                    .innerText,
        });

        localStorage.setItem("ignoreList", JSON.stringify(this._ignoreList));
    }

    #appendIgnoreLinkElem(node) {
        let linkElem = this.#getUserLinkElem(node);
        console.log(
            `BlackList Addon v 1.0: currentUserLink: ${this.#currentUserLink}`
        );

        if (!this.#currentUserLink) location.reload();

        if (linkElem.href === this.#currentUserLink) return;
        if (linkElem.ignoreLinkAppended) return;

        let params = linkElem.parentNode.getBoundingClientRect();

        let ignoreLink = document.createElement("a");
        linkElem.parentNode.style.position = "relative";

        ignoreLink.style.position = "absolute";
        linkElem.parentNode.append(ignoreLink);

        linkElem.ignoreLinkAppended = true;

        ignoreLink.innerText = "[ Ignore ]";
        ignoreLink.href = "#";
        ignoreLink.style.color = "#6bd089";
        ignoreLink.style.opacity = 0.6;
        ignoreLink.style.fontSize = "10px";
        ignoreLink.style.whiteSpace = "nowrap";
        ignoreLink.style.overflow = "visible";
        ignoreLink.style.zIndex = 1000;

        ignoreLink.style.top = params.bottom + params.height + 20;

        ignoreLink.onclick = () => {
            this.#addToIgnoreList(node, linkElem);
        };
    }

    #appendIgnoreLinkElements(elements) {
        elements.forEach(element => {
            this.#appendIgnoreLinkElem(element);
        });
    }

    #filterContainedElements(containedElements) {
        containedElements.forEach(element => {
            let containerUserLink = this.#getUserLinkElem(element).href;

            if (this._ignoreList.some(user => user.url === containerUserLink)) {
                element.remove();
            }
        });
    }
}

class UI extends Observer {
    constructor() {
        super();
        super._observe();
    }

    #win;

    render() {
        let serviceButton = this.#createServiceButton();

        serviceButton.onclick = () => {
            this.#win = this.#createUIWindow({ width: 400, height: 300 });

            this.#setBlackListHeadInfo();
            this.#renderBlackListUI();
            this.#showDownloadBlackList();
            this.#showUploadBlackList();
        };
    }

    #createServiceButton() {
        let button = document.createElement("button");

        button.innerText = "Black List";

        button.style.width = "150px";
        button.style.height = "50px";
        button.style.position = "fixed";
        button.style.left = 0;
        button.style.bottom = "10px";
        button.style.zIndex = 999999;
        button.style.border = "1px dashed green";

        button.onmouseover = () => {
            button.style.cursor = "pointer";
        };

        document.body.append(button);
        return button;
    }

    #createUIWindow({ width, height }) {
        let win = window.open(
            "about:blank",
            "Moderator Service",
            `width=${width}, height=${height}`
        );

        return win;
    }

    #renderBlackListUI() {
        let ol = document.createElement("ol");
        let prevOl = this.#win.document.body.querySelector("ol");

        if (prevOl) {
            prevOl.remove();
        }

        this.#win.document.body.append(ol);

        this._ignoreList.forEach(item => {
            let li = document.createElement("li");
            let profileLink = document.createElement("a");
            let removeLink = document.createElement("a");

            removeLink.innerText = "[ Remove ]";
            removeLink.href = "#";
            profileLink.innerText = "[ Profile ]";
            profileLink.href = item.url;

            li.append(item.name, profileLink, removeLink);

            removeLink.onclick = () => {
                this.#removeFromIgnoreList(item);
                li.remove();
                this.#setBlackListHeadInfo();

                this.#refreshWindow();
            };

            ol.append(li);
        });
    }

    #removeFromIgnoreList(item) {
        this._ignoreList = this._ignoreList.filter(
            user => user.url !== item.url
        );
        localStorage.setItem("ignoreList", JSON.stringify(this._ignoreList));
    }

    #setBlackListHeadInfo() {
        let oldH1 = this.#win.document.body.querySelector("h1");

        if (oldH1) {
            oldH1.remove();
        }

        let h1 = document.createElement("h1");
        h1.innerText = `BlackList (${this._ignoreList.length})`;
        this.#win.document.body.prepend(h1);
    }

    #refreshWindow() {
        setTimeout(() => {
            this.#win.close();
        }, 500);
        setTimeout(() => {
            location.reload();
        }, 600);
    }

    #showDownloadBlackList() {
        let data = this._ignoreList;
        let blob = new Blob([JSON.stringify(data)], {
            type: "application/json",
        });

        let downloadLink = document.createElement("a");
        downloadLink.innerText = "Download BlackList";
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "blackListOtvetiRu.json";

        this.#win.document.body.append(downloadLink);
    }

    #showUploadBlackList() {
        let fileField = document.createElement("input");
        fileField.style.display = "block";
        fileField.style.marginTop = "10px";
        fileField.type = "file";
        fileField.accept = "application/json";

        let reader = new FileReader();

        reader.onload = () => {
            let userUpload = reader.result;

            if (!userUpload) return;

            try {
                let errorStatus = false;
                let settings = JSON.parse(userUpload);

                settings.forEach(({ url, name } = {}) => {
                    if (!url || !name) {
                        errorStatus = true;
                    }
                });

                if (errorStatus) {
                    alert("Wrong settings");
                    return;
                }

                this._ignoreList = [...settings];
                localStorage.setItem(
                    "ignoreList",
                    JSON.stringify(this._ignoreList)
                );

                this.#refreshWindow();
            } catch (err) {
                alert("File is not a JSON format.");
            }
        };

        fileField.onchange = event => {
            let file = event.target.files[0];
            reader.readAsText(file);
        };

        this.#win.document.body.append(fileField);
    }
}

let ui = new UI();
ui.render();
