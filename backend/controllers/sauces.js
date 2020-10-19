const Sauce = require('../models/sauces');
const User = require('../models/user');
const fs = require('fs');
const async = require('async');

// Pour créer une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
    const sauce = new Sauce({
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save().then(
      () => {
        res.status(201).json({
          message: 'Sauce ajoutée avec succès !'
        });
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };

// Pour modifier une sauce
  exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Objet modifié !'}))
      .catch(error => res.status(400).json({ error }));
  };

// Pour supprimer une sauce
  exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
            .catch(error => res.status(400).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
  };

// Pour récupérer une sauce
  exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
      _id: req.params.id
    }).then(
      (sauce) => {
        res.status(200).json(sauce);
      }
    ).catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
  }

// Pour récupérer toutes les sauces
  exports.getAllSauces = (req, res, next) => {
    Sauce.find().then(
      (sauces) => {
        res.status(200).json(sauces);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  }

// Systeme like et dislike
exports.likeSauce = (req, res, next) => {
async.waterfall ([
  // Vérification existence de la sauce
  function(done) {
    Sauce.findOne({
      _id: req.params.id
    }).then (
      function(sauceFound) {
        done(null, sauceFound);
      }
    ).catch(function(err) {
      return res.status(500).json({error: 'Sauce non trouvée'})
    });
  },
  // Vérification existence du user
  function(sauceFound, done) { 
    if(sauceFound) {
      User.findOne({
        _id: req.body.userId
      }).then (
        function(userFound) {
          done(null, sauceFound, userFound);
        }
      ).catch(function(err) {
        return res.status(500).json({error: 'Utilisateur non trouvé'})
      });
    }
  },
  // Vérification si user déjà présent dans tableau usersLiked ou tableau usersDisliked
  function(sauceFound, userFound, done) {
    if(userFound) {
      const idUserInLikes = sauceFound.usersLiked.includes(userFound._id);
      const idUserInDislikes = sauceFound.usersDisliked.includes(userFound._id);
      let sauceUpdate = {};
      if(idUserInLikes == true) {
        const currentLikes = sauceFound.likes;
        const newLikes = currentLikes - 1;
        let currentUsersLiked = sauceFound.usersLiked;
        const indexUser = currentUsersLiked.indexOf(userFound._id);
        currentUsersLiked.splice(indexUser, 1);
        sauceUpdate = {
          usersLiked: currentUsersLiked,
          likes: newLikes
        }
      } else if(idUserInDislikes == true) {
        const currentDislikes = sauceFound.dislikes;
        const newDislikes = currentDislikes - 1;
        let currentUsersDisliked = sauceFound.usersDisliked;
        const indexUser = currentUsersDisliked.indexOf(userFound._id);
        currentUsersDisliked.splice(indexUser, 1);
        sauceUpdate = {
          usersDisliked: currentUsersDisliked,
          dislikes: newDislikes
        }
      }
      // Si user trouvé dans tableau usersLiked ou tableau usersDisliked : annulation du vote
      Sauce.updateOne({ _id: sauceFound._id }, sauceUpdate)
      .then (
        function(updatedSauce) {
          done(null, sauceFound, userFound, updatedSauce);
        }
      )
      .catch(function(err) {
        return res.status(500).json({error: 'Erreur lors de l\'annulation'})
      });
    }
  },
  // 
  function(sauceFound, userFound, updatedSauce, done) {
    //console.log(sauceFound);
    //console.log(userFound);
    console.log(updatedSauce);

    /*if(sauceFound) {
      User.findOne({
        _id: req.body.userId
      }).then (
        function(userFound) {
          done(null, sauceFound, userFound);
        }
      ).catch(function(err) {
        return res.status(500).json({error: 'Utilisateur non trouvé'})
      });
    }*/
  },  


]
  
  
  , function (err, result) {
  res.status(200).json({result : 'Votre avis a été pris en compte'})
})
}
