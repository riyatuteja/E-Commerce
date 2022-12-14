require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SK);
const uuid = require("uuid/v4");
let custId = "";
exports.makePayment = (req, res) => {
  const { products, token } = req.body;

  let amount = 0;
  products.map((p) => {
    amount = amount + p.price;
  });
  const idempotencyKey = uuid();
  return stripe.customers
    .create({
      email: token.email,
      source: token.id,
    })
    .then((customer) => {
      custId = customer.id;
      stripe.charges
        .create(
          {
            amount: amount * 100,
            currency: "INR",
            customer: customer.id,
            receipt_email: token.email,
            description: `Stripe Testing`,
            shipping: {
              name: token.card.name,
              address: {
                line1: token.card.address_line1,
                line2: token.card.address_line2,
                city: token.card.address_city,
                country: token.card.address_country,
                postal_code: token.card.address_zip,
              },
            },
          },
          {
            idempotencyKey,
          }
        )
        .then((result) => {
          //   console.log(custId);

          stripe.charges.retrieve(custId, (err, charge) => {
            result = {
              ...result,

              transactionId: custId,
            };
            return res.status(200).json(result);
          });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};
