const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid')

const app = express();

// Middleware para poder rodar JSON
app.use(express.json())

const costumers = [];

function verifyIfExistAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = costumers.find(costumers => costumers.cpf === cpf);

    if(!customer){
        return res.status(400).json({error: "Customer not found!"})
    }

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === "credit"){
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0);

    return balance
}

/*
 CPF       -> string
 name      -> string
 id        -> uuid
 statement -> []
*/

// Criação de uma conta
app.post('/account', (req, res) => {
    const { cpf, name } = req.body;

    const custumerAlreadyExists = costumers.some((customer) => customer.cpf === cpf)

    // Verificação de o CPF existe
    if(custumerAlreadyExists){
        return res.status(400).json({error: "Customer already exists!"})
    }

    costumers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return res.status(201).send()

});

// Consulta de Statement por cpf
app.get("/statement", verifyIfExistAccountCPF, (req, res) => {

    const { customer } = req;
    return res.json(customer.statement);
})

// Operação para adicionar dinheiro dentro da conta.
app.post("/deposit", verifyIfExistAccountCPF, (req, res) => {
    const { description, amount } = req.body;

    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)

    return res.status(201).send()
});

// Realizando saque em uma conta.
app.post("/withdraw", verifyIfExistAccountCPF, (req,res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement)

    if(balance < amount) {
        return res.status(400).json({error: "Insuficiente"})
    }
    
    
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();
})

// Realizando consulta por data "ano-mes-dia"
app.get("/statement/date", verifyIfExistAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00") 

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return res.json(statement);
})

// Atualizar um usuário.
app.put("/account", verifyIfExistAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return response.status(201).send()
})


app.get("/account", verifyIfExistAccountCPF, (req,res) => {
    const { customer } = req;

    return res.json(costumers);
})

app.delete("/account", verifyIfExistAccountCPF, (req,res) => {
    const { costumer } = req;

    costumers.splice(costumer, 1)

    return res.status(200).json(costumers);
})

app.get("/balance", verifyIfExistAccountCPF, (req, res) => {
    const { costumer } = req;

    const balance = getBalance(costumer.statement);

    return res.json(balance);
})






app.listen(8080);

 