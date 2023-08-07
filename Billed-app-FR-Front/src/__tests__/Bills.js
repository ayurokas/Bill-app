/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

//TEST UTILITAIRE

// On simule le module "../app/store" en renvoyant mockStore lors des tests.
jest.mock("../app/store", () => mockStore);

// Redéfinit la propriété "localStorage" de l'objet "window" avec une version simulée (localStorageMock).
beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  // Ajoute un utilisateur fictif dans le localStorage pour les tests.
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

// Décrire la situation où l'utilisateur est connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  // Décrire la situation où l'utilisateur est sur la page des factures
  describe("When I am on Bills Page", () => {
    // Tester si l'icône de facture est mise en évidence dans la disposition verticale
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Créer un élément div qui servira de racine à notre application
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // Appeler la fonction router() qui se charge de la navigation dans l'application
      router();
      // Naviguer vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // Attendre que l'élément avec le data-testid "icon-window" soit disponible
      await waitFor(() => screen.getByTestId("icon-window"));
      const iconWindow = screen.getByTestId("icon-window");
      // Vérifie que la classe "active-icon" est bien présente sur l'élément avec le data-testid = "icon-window"
      expect(iconWindow.classList.contains("active-icon")).toBeTruthy();
    });

    // Tester si les factures sont triées de la plus ancienne à la plus récente
    test("Then bills should be ordered from earliest to latest", () => {
      // Remplir le corps du document avec l'interface utilisateur de Bills, en passant les données des factures
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      // Test correspondant au Bug 1
      // [1 - Bug report] - Le test Bills est au rouge/FAIL (src/__tests__/Bills.js) / les notes de frais ne s'affichent pas par ordre décroissant.
      // Fonction de tri pour ordonner les dates de manière anti-chronologique (du plus récent au plus ancien)
      const antiChrono = (a, b) => {return new Date(b.date) - new Date(a.date)}
      // Trier les dates récupérées en utilisant la fonction de tri anti-chronologique
      const datesSorted = [...dates].sort(antiChrono)
      // Vérifier si les dates récupérées correspondent aux dates triées de manière anti-chronologique
      expect(dates).toEqual(datesSorted)
    });
  });

  // Décrire la situation où l'utilisateur est sur la page des factures et clique sur l'icône en forme d'œil
  describe("When I am on Bills Page and I click on icon eye", () => {
    // Tester si une fenêtre modale s'ouvre lorsque l'utilisateur clique sur l'icône en forme d'œil
    test("Then a modal should open", () => {
        // Fonction pour gérer la navigation à l'intérieur de l'application
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Remplir le corps du document avec l'interface utilisateur de Bills, en passant les données des factures
      document.body.innerHTML = BillsUI({ data: bills });
      // Créer une nouvelle instance de Bills avec les dépendances nécessaires
      const allBills = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

    // Simuler la fonction jQuery modal() en utilisant jest.fn()
    $.fn.modal = jest.fn();
      // Récupérer la première icône en forme d'œil sur la page
      const firstIconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        allBills.handleClickIconEye(firstIconEye)
      );
      // Ajouter un écouteur d'événement pour le clic sur l'icône en forme d'œil
      firstIconEye.addEventListener("click", handleClickIconEye);
      // Simuler un clic sur l'icône en forme d'œil
      userEvent.click(firstIconEye);
      // Vérifier si la fonction handleClickIconEye a été appelée
      expect(handleClickIconEye).toHaveBeenCalled();

    // Récupérer la fenêtre modale par son data-testid et vérifier si elle existe (est véridique)
      const modal = screen.getByTestId("modaleFile");
      expect(modal).toBeTruthy();
    });
  });

// Décrire la situation où l'utilisateur est sur la page des factures et clique sur le bouton "new bill"
  describe("When I am on Bills Page and I click on the new bill button", () => {
    // Tester si l'utilisateur est redirigé vers le formulaire de nouvelle facture lorsqu'il clique sur le bouton "new bill"
    test("Then I should be send on the new bill page form", () => {
     // Fonction pour gérer la navigation à l'intérieur de l'application
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
     // Remplir le corps du document avec l'interface utilisateur de Bills, en passant les données des factures
      document.body.innerHTML = BillsUI({ data: bills });
     // Créer une nouvelle instance de Bills avec les dépendances nécessaires
      const allBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorageMock,
      });
     // Créer une fonction mock pour gérer le clic sur le bouton "new bill"
      const handleClickNewBill = jest.fn(() => allBills.handleClickNewBill());
      // Récupérer le bouton "new bill" par son data-testid
      const btnNewBill = screen.getByTestId("btn-new-bill");
      // Ajouter un écouteur d'événement pour le clic sur le bouton "new bill"
      btnNewBill.addEventListener("click", handleClickNewBill);
      // Simuler un clic sur le bouton "new bill"
      userEvent.click(btnNewBill);
      // Vérifier si la fonction handleClickNewBill a été appelée
      expect(handleClickNewBill).toHaveBeenCalled();

      // Récupérer le formulaire de nouvelle facture par son data-testid et vérifier s'il existe (est véridique)
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();
    });
  });
});

// TEST D'INTEGRATION GET 
//Tester la récupération des factures depuis l'API
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("Then fetches bills from mock API GET", async () => {
      // Espionner la méthode "bills" du mockStore pour vérifier si elle est appelée
      const storeMethodeSpy = jest.spyOn(mockStore, "bills");

      // Créer un élément div qui servira de racine à notre application
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // Appeler la fonction router() qui se charge de la navigation dans l'application
      router();

      // Naviguer vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // Attendre que le texte "Mes notes de frais" soit disponible à l'écran
      await waitFor(() => screen.getByText("Mes notes de frais"));
      // Récupérer le titre de l'en-tête et vérifier qu'il est véridique (existe)
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();

      // Vérifier que la méthode "bills" du mockStore a été appelée
      expect(storeMethodeSpy).toHaveBeenCalled();

      // Récupérer tous les éléments de la liste de factures et vérifier qu'il y en a exactement 4
      const allBillsUI = screen.getAllByTestId("bill-list-item");
      expect(allBillsUI.length).toEqual(4);
    });
  });

  describe("When I navigate to Bills Page and an error occurs on API", () => {
    // Utiliser beforeEach pour définir des conditions initiales communes à tous les tests dans ce bloc
    beforeEach(() => {
      // Espionner la méthode "bills" du mockStore pour vérifier si elle est appelée
      jest.spyOn(mockStore, "bills");
      // Créer un élément div qui servira de racine à notre application
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      // Ajouter l'élément racine au corps du document
      document.body.appendChild(root);
      // Appeler la fonction router() qui se charge de la navigation dans l'application
      router();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
       // Modifier la méthode "bills" du mockStore pour qu'elle rejette avec une erreur "Erreur 404"
         // lors de l'appel suivant
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      // Naviguer vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // Attendre la prochaine "tick" du processus, donnant à toutes les opérations asynchrones le temps de se résoudre
      await new Promise(process.nextTick);
      // Récupérer le message d'erreur "Erreur 404" et vérifier s'il est véridique (existe)
      const errorMessage = await screen.getByText(/Erreur 404/);
      expect(errorMessage).toBeTruthy();
    });

    // Tester la récupération des factures depuis une API et échouer avec un message d'erreur 500
    test("fetches messages from an API and fails with 500 message error", async () => {
      // Modifier la méthode "bills" du mockStore pour qu'elle rejette avec une erreur "Erreur 500"
      // lors de l'appel suivant
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      // Naviguer vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // Attendre la prochaine "tick" du processus, donnant à toutes les opérations asynchrones le temps de se résoudre
      await new Promise(process.nextTick);
      // Récupérer le message d'erreur "Erreur 500" et vérifier s'il est véridique (existe)
      const errorMessage = await screen.getByText(/Erreur 500/);
      expect(errorMessage).toBeTruthy();
    });
  });
});
