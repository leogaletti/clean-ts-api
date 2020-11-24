import { SignUpController } from './signup-controller'
import { MissingParamError, ServerError } from '../../errors'
import { AddAcount, AddAcountModel, AccountModel, Validation } from './signup-controller-protocols'
import { HttpRequest } from '../../protocols'
import { ok, serverError, badRequest } from '../../helpers/http/http-helper'

/*

Todos os testes dependem desse mock.
Se criar o validador de email como false, todos os outros testes irão falhar porque irá
cair na validação do e-mail.
Pra que isso não aconteça, colocamos sempre como true e no teste específico onde
precisamos que seja outro valor, utilizamos o jest para ficar espionando o método
e alterar o retorno do seu valor.

 */

const makeAddAcount = (): AddAcount => {
  class AddAcountStub implements AddAcount {
    async add (account: AddAcountModel): Promise<AccountModel> {
      return await new Promise(resolve => resolve(makeFakeAccount()))
    }
  }
  return new AddAcountStub()
}

const makeValidation = (): Validation => {
  class ValidationStub implements Validation {
    validate (input: any): Error {
      return null
    }
  }
  return new ValidationStub()
}

const makeFakeRequest = (): HttpRequest => ({
  body: {
    name: 'any_name',
    email: 'any_email@mail.com',
    password: 'any_password',
    passwordConfirmation: 'any_password'
  }
})

const makeFakeAccount = (): AccountModel => ({
  id: 'valid_id',
  name: 'valid_name',
  email: 'valid_email@mail.com',
  password: 'valid_password'
})
interface SutTypes {
  sut: SignUpController
  addAcountStub: AddAcount
  validationStub: Validation
}

const makeSut = (): SutTypes => {
  const addAcountStub = makeAddAcount()
  const validationStub = makeValidation()
  const sut = new SignUpController(addAcountStub, validationStub)
  return {
    sut,
    addAcountStub,
    validationStub
  }
}

describe('SignUp Controller', () => {
  test('Should call AddAcount with correct values', async () => {
    const { sut, addAcountStub } = makeSut()
    const addSpy = jest.spyOn(addAcountStub, 'add')
    await sut.handle(makeFakeRequest())
    expect(addSpy).toHaveBeenCalledWith({
      name: 'any_name',
      email: 'any_email@mail.com',
      password: 'any_password'
    })
  })

  test('Should return 500 if AddAccount throws', async () => {
    const { sut, addAcountStub } = makeSut()
    jest.spyOn(addAcountStub, 'add').mockImplementationOnce(async () => {
      return await new Promise((resolve, reject) => reject(new Error()))
    })
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse).toEqual(serverError(new ServerError(null)))
  })

  test('Should return 200 if valid data is provided', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse).toEqual(ok(makeFakeAccount()))
  })

  test('Should call Validation with correct values', async () => {
    const { sut, validationStub } = makeSut()
    const validateSpy = jest.spyOn(validationStub, 'validate')
    const httpRequest = makeFakeRequest()
    await sut.handle(httpRequest)
    expect(validateSpy).toHaveBeenCalledWith(httpRequest.body)
  })

  test('Should return 400 if Validation returns an error', async () => {
    const { sut, validationStub } = makeSut()
    jest.spyOn(validationStub, 'validate').mockReturnValueOnce(new MissingParamError('any_field'))
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse).toEqual(badRequest(new MissingParamError('any_field')))
  })
})
