/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// Utiliser Jest pour simuler le module "../app/store"
// Remplacer les exportations de ce module par les valeurs fournies dans "mockStore"
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

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I upload a file with valid extension (jpg, jpeg, png)", () => {
      // Fonction pour gérer la navigation à l'intérieur de l'application
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Obtenir le HTML pour la page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion

      // Créer une nouvelle instance de NewBill avec les dépendances nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Créer une fonction mock pour gérer le changement de fichier
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      // Récupérer l'input de type fichier par son data-testid
      const inputFile = screen.getByTestId("file");
      // Ajouter un écouteur d'événement pour le changement de fichier
      inputFile.addEventListener("change", handleChangeFile);
      // Simuler un changement de fichier avec un fichier ayant une extension valide (jpg)
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["test-valid-extension.jpg"], "test-valid-extension.jpg", {
              type: "image/jpg",
            }),
          ],
        },
      });

      // Vérifier si la fonction handleChangeFile a été appelée
      expect(handleChangeFile).toHaveBeenCalled();
      // Vérifier que le type de fichier de l'input est "image/jpg"
      expect(inputFile.files[0].type).toBe("image/jpg");
    });

    // Tester si l'utilisateur télécharge un fichier avec une extension non valide
    test("Then I upload a file with invalid extension", async () => {
      // Fonction pour gérer la navigation à l'intérieur de l'application
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Obtenir le HTML pour la page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Créer une nouvelle instance de NewBill avec les dépendances nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });
      // Simuler la fonction d'alerte de la fenêtre
      window.alert = jest.fn();

      // Créer une fonction mock pour gérer le changement de fichier
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      // Récupérer l'input de type fichier par son data-testid
      const inputFile = screen.getByTestId("file");
      // Ajouter un écouteur d'événement pour le changement de fichier
      inputFile.addEventListener("change", handleChangeFile);
      // Simuler un changement de fichier avec un fichier ayant une extension non valide (gif)
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(
              ["test-invalid-extension.gif"],
              "test-invalid-extension.gif",
              { type: "image/gif" }
            ),
          ],
        },
      });
      // Vérifier si la fonction handleChangeFile a été appelée
      expect(handleChangeFile).toHaveBeenCalled();
      // Vérifier que le type de fichier de l'input est "image/gif"
      expect(inputFile.files[0].type).toBe("image/gif");
      // Vérifier si l'alerte a été déclenchée (supposant que vous utilisez alert pour signaler une extension non valide)
      expect(window.alert).toHaveBeenCalled();
      // Vérifier que la valeur de l'input est réinitialisée (supposant que vous réinitialisez la valeur en cas d'extension non valide)
      expect(inputFile.value).toBe("");
    });
  });

  // Décrire la situation où l'utilisateur est sur la page NewBill et soumet le formulaire de nouvelle facture
  describe("When I am on NewBill Page and I submit the New Bill form", () => {
    // Tester si la méthode handleSubmit est appelée lors de la soumission du formulaire
    test("Then It should call handleSubmit method", () => {
      // Fonction pour gérer la navigation à l'intérieur de l'application
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Obtenir le HTML pour la page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;

       // Créer une nouvelle instance de NewBill avec les dépendances nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });
      // Créer une fonction mock pour gérer la soumission du formulaire
      const handleSubmitMethode = jest.fn(newBill.handleSubmit);
      // Récupérer le formulaire de nouvelle facture par son data-testid
      const formNewBill = screen.getByTestId("form-new-bill");
      // Ajouter un écouteur d'événement pour la soumission du formulaire
      formNewBill.addEventListener("submit", handleSubmitMethode);
      // Simuler la soumission du formulaire
      fireEvent.submit(formNewBill);
      // Vérifier si la fonction handleSubmitMethode a été appelée
      expect(handleSubmitMethode).toHaveBeenCalled();
    });
  });
});

// test d'intégration POST
//Tester la création d'une nouvelle facture
describe("Given I am a user connected as an employee", () => {
  describe("When I create a new bill", () => {
    test("Then it should fetches new bill to mock API POST and redirected me to Bills Page", async () => {
      // Créer un élément div qui servira de racine à notre application
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      // Appeler la fonction router() qui se charge de la navigation dans l'application
      router();

      // Espionner la méthode "bills" du mockStore et la remplacer par une implémentation qui résout immédiatement une promesse
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve();// Simuler une réponse réussie de l'API
          },
        };
      });

      // Naviguer vers la page de création de nouvelle facture
      window.onNavigate(ROUTES_PATH.NewBill);
      // Attendre la prochaine "tick" du processus, donnant à toutes les opérations asynchrones le temps de se résoudre
      await new Promise(process.nextTick);
      // Récupérer le titre de l'en-tête et vérifier qu'il est véridique (existe)
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();
    });
  });

  describe("When I create a new bill and an error occurs on API", () => {
    beforeEach(() => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      test("Then fetches bills to mock API POST and fails with 404 message error", async () => {
        jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("Then fetches new bill to mock API POST and fails with 500 message error", async () => {
        jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
