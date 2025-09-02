import StartPage from "./pages/start";
import CategoriesPage from "./pages/categories";
import ItemsPage from "./pages/items";
import LotteryPage from "./pages/lottery";

import { useCredentialsStore } from "./store/credentials";
import { useLotteryStore } from "./store/lottery";
import { usePuzzleStore } from "./store/puzzle";

export type Page = 'start' | 'categories' | 'items' | 'lottery'
type Category = string | undefined

export async function renderPage(page: Page, category?: Category) {
    const pages = {
        'start': {
            pageFn: StartPage,
            templateId: "start"
        },
        'categories': {
            pageFn: CategoriesPage,
            templateId: "categories"
        },
        'items': {
            pageFn: () => ItemsPage(category!),
            templateId: "items"
        },
        'lottery': {
            pageFn: LotteryPage,
            templateId: "lottery"
        }
    }

    const { pageFn, templateId } = pages[page]

    const app = document.querySelector('#app') as HTMLElement;
    const pageTemplate = document.querySelector(`template#${templateId}`) as HTMLTemplateElement

    app.innerHTML = ''
    app.appendChild(pageTemplate.content.cloneNode(true))

    await pageFn();
}

Promise.all([
    usePuzzleStore.persist.rehydrate(),
    useLotteryStore.persist.rehydrate(),
]).then(async () => {
    console.log(useCredentialsStore.getState())
    console.log(useLotteryStore.getState())
    console.log(usePuzzleStore.getState())
    await renderPage("categories");
})

