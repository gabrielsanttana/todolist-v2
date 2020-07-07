const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URL}/todolistDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemSchema]
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "Hit the checkbox the delete an item"
});

const defaultItems = [item1, item2, item3];

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if(err) {
      console.log(err);
    }else {
      res.render("todolist", {listTitle: "Today", items: foundItems});
    }
  });
});

app.get("/:listName", (req, res) => {
  const listNameLower = _.toLower(req.params.listName);

  List.findOne({name: listNameLower}, (err, foundList) => {
    if(err) {
      console.log(err);
    }else {
      if(foundList) {
        //Show an existing list
        res.render("todolist", {listTitle: _.capitalize(foundList.name), items: foundList.items});
      }else {
        //Create a new list 
        const newList = new List({
          name: listNameLower,
          items: defaultItems
        });

        newList.save();

        res.redirect("/"+listNameLower);
      }
    }
  });

});

app.post("/", function(req, res) {
  const { newItem: itemName, list: listName } = req.body;

  if(itemName != "") {
    const item = new Item({
      name: itemName
    });

    if(listName === "Today") {
      item.save((err) => {
        if(err) {
          console.log(err);
        }else {
          console.log("Item successfully added to the database");
        }
      });
  
      res.redirect("/");
    }else{
      List.findOne({name: _.toLower(listName)}, function(err, foundList) {
        foundList.items.push(item);

        //Waiting for server to save the new item to database before reloding the page
        foundList.save().then(function() {
          res.redirect("/"+listName);
        });
      });
    }
    
  }else {
    if(listName === "Today") {
      res.redirect("/");
    }else {
      res.redirect("/"+_.toLower(listName));
    }
  }
});

app.post("/delete", (req, res) => {
  const { checkbox: idToDelete, listName } = req.body;

  if(listName === "Today") {
    Item.findByIdAndDelete(idToDelete, (err) => {
      if(err) {
        console.log(err);
      }else {
        console.log("Checked item successfully deleted from database");
        res.redirect("/");
      }
    });
  }else {
    List.findOneAndUpdate({name: _.toLower(listName)}, {$pull: {items: {_id: idToDelete}}}, function(err, foundList) {
      if(err) {
        console.log(err);
      }else {
        res.redirect("/"+_.toLower(listName));
      }
    });
  }
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log(`Server is running on port ${port}`);
}); 
