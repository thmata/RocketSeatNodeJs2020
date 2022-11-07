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

/*
 CPF       -> string
 name      -> string
 id        -> uuid
 statement -> []
*/

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




app.listen(8080);

 