/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import { fireEvent } from "@testing-library/dom";
//import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage";
jest.mock("../app/store", () => mockStore)
describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy();
    })

    test("the the text Envoyer une note de frais  should be displayed on top of the page", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      //await waitFor(() => screen.getAllByText('Envoyer une note de frais'))
      const title = screen.getAllByText('Envoyer une note de frais')
      expect(title).toBeTruthy();
    })

  })

  test("when i click on the button nouvelle note de frais the form appearse with it's fields", () => {
    document.body.innerHTML = NewBillUI()
    expect(screen.getByTestId("form-new-bill")).toBeTruthy()// le formilaire
    expect(screen.getByTestId("expense-type")).toBeTruthy()
    expect(screen.getByTestId("expense-name")).toBeTruthy()
    expect(screen.getByTestId("datepicker")).toBeTruthy()
    expect(screen.getByTestId("amount")).toBeTruthy()
    expect(screen.getByTestId("vat")).toBeTruthy()
    expect(screen.getByTestId("pct")).toBeTruthy()
    expect(screen.getByTestId("commentary")).toBeTruthy()
    expect(screen.getByTestId("file")).toBeTruthy()
    expect(screen.getByRole("button")).toBeTruthy()
  })

  test('Then I can select upload an image file', () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a.com" }))
    document.body.innerHTML = NewBillUI()
    mockStore.bills = jest.fn().mockImplementation(() => { return { create: () => { Promise.resolve({}) } } })
    const onNavigate = (pathname) => { document.body.innerHTML = pathname }
    const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
    const handleChangeFile = jest.fn(newBill.handleChangeFile)
    const inputFile = screen.getByTestId("file")
    expect(inputFile).toBeTruthy()
    const file = new File(["file"], "file.jpg", { type: "image/jpeg" })
    inputFile.addEventListener("change", handleChangeFile)
    fireEvent.change(inputFile, { target: { files: [file] } })
    expect(handleChangeFile).toHaveBeenCalled()
    //expect(inputFile.files).toHaveLength(1)
    expect(inputFile.files[0].name).toBe("file.jpg")
    //const allowedFileExtensions = ['jpeg', 'jpg', 'png']
    //expect(inputFile.file[0].type).toBe('jpg');
    /*
    const stateOfFile = allowedFileExtensions.includes(inputFile.files[0].type);
    expect(stateOfFile.toBe(true));*/
    jest.spyOn(window, "alert").mockImplementation(() => { })
    expect(window.alert).not.toHaveBeenCalled()
  })
  //testant si une autre extesnssion pourra pas passer
  test("Then i check if non image files can't be uploader", () => {
    document.body.innerHTML = NewBillUI()
    const store = null
    const onNavigate = (pathname) => { document.body.innerHTML = pathname }
    const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })
    const handleChangeFile = jest.fn(newBill.handleChangeFile)
    const inputFile = screen.getByTestId("file")
    expect(inputFile).toBeTruthy()
    inputFile.addEventListener("change", handleChangeFile)
    fireEvent.change(inputFile, { target: { files: [new File(["file.zip"], "file.zip", { type: "file/zip" })] } })
    expect(handleChangeFile).toHaveBeenCalled()
    expect(inputFile.files[0].name).not.toBe("file.jpg")
    jest.spyOn(window, "alert").mockImplementation(() => { })
    expect(window.alert).toHaveBeenCalled()
  })

  //tester la validité des champs

  describe('Given I am a user connected as Employee', () => {
    describe("When I submit the form completed with all fields", () => {
      test("Then the bill is created", () => {
        document.body.innerHTML = NewBillUI()
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a.com" }))
        const newBill = new NewBill({ document, onNavigate, store: null, localStorage: window.localStorage })
        const billMock = {
          type: "Restaurants et bars",
          name: "Vol Paris Amesterdam",
          date: "2022-05-11",
          amount: 120,
          vat: 70,
          pct: 30,
          commentary: " restau italien pour une reunion ",
          fileUrl: "../img/0.jpg",
          fileName: "darkhorse.jpg",
          status: "pending"
        }
        screen.getByTestId("expense-type").value = billMock.type
        screen.getByTestId("expense-name").value = billMock.name
        screen.getByTestId("datepicker").value = billMock.date
        screen.getByTestId("amount").value = billMock.amount
        screen.getByTestId("vat").value = billMock.vat
        screen.getByTestId("pct").value = billMock.pct
        screen.getByTestId("commentary").value = billMock.commentary
        newBill.fileName = billMock.fileName
        newBill.fileUrl = billMock.fileUrl
        newBill.updateBill = jest.fn()
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(newBill.updateBill).toHaveBeenCalled()
      })

    })
    test('fetches error from an API and fails with 500 error', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => { })
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      mockStore.bills = jest.fn().mockImplementation(() => {
        return {
          update: () => Promise.reject(new Error('Erreur 500')),
          list: () => Promise.reject(new Error('Erreur 500'))
        }
      })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Submit form
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })

  })




})