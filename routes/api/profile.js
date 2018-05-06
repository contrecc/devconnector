const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const prependHttp = require('prepend-http');

// Load Validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

//Load Profile Model
const Profile = require('../../models/Profile');
//Load User Model
const User = require('../../models/User');

// @route   GET api/profile
// @desc    Gets current user's profile
// @access  Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile || profile.length === 0) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: 'There are no profiles' }));
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: 'There is no profile for this user' })
    );
});

// @route   POST api/profile
// @desc    Create or Edit user profile
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;

    const standardFields = [
      'handle',
      'company',
      'website',
      'location',
      'bio',
      'status',
      'githubusername'
    ];

    const socialFields = [
      'youtube',
      'twitter',
      'facebook',
      'linkedin',
      'instagram'
    ];

    // Assign standard profile fields
    standardFields.forEach(field => {
      if (req.body[field]) profileFields[field] = req.body[field];
    });

    // Assign social profile fields
    profileFields.social = {};
    socialFields.forEach(field => {
      if (req.body[field]) profileFields.social[field] = req.body[field];
    });

    // User prependHttp to ensure secure user-submitted links
    if (req.body.youtube)
      profileFields.social.youtube = prependHttp(req.body.youtube, {
        https: true
      });
    if (req.body.twitter)
      profileFields.social.twitter = prependHttp(req.body.twitter, {
        https: true
      });
    if (req.body.facebook)
      profileFields.social.facebook = prependHttp(req.body.facebook, {
        https: true
      });
    if (req.body.linkedin)
      profileFields.social.linkedin = prependHttp(req.body.linkedin, {
        https: true
      });
    if (req.body.instagram)
      profileFields.social.instagram = prependHttp(req.body.instagram, {
        https: true
      });

    //Skills - Split into an array
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',');
    }

    Profile.findOne({ user: profileFields.user })
      .then(profile => {
        Profile.findOne({ handle: profileFields.handle })
          .then(profileWithHandle => {
            if (profileWithHandle) {
              if (profileWithHandle.user.toString() !== profileFields.user) {
                errors.handle = 'That handle already exists';
                return res.status(400).json(errors);
              }
            }

            if (profile && !errors.handle) {
              Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
              )
                .then(profile => {
                  res.json(profile);
                })
                .catch(err =>
                  res.status(500).json({
                    server: 'Something went wrong, please try again soon'
                  })
                );
            } else if (!errors.handle) {
              new Profile(profileFields)
                .save()
                .then(profile => res.json(profile))
                .catch(err =>
                  res.status(500).json({
                    server: 'Something went wrong, please try again soon'
                  })
                );
            }
          })
          .catch(err =>
            res
              .status(500)
              .json({ server: 'Something went wrong, please try again soon' })
          );
      })
      .catch(err =>
        res
          .status(500)
          .json({ server: 'Something went wrong, please try again soon' })
      );
  }
);

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to experience array
      profile.experience.unshift(newExp);
      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to experience array
      profile.education.unshift(newEdu);
      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        profile.experience.remove({ _id: req.params.exp_id });

        profile
          .save()
          .then(profile => res.json(profile.experience))
          .catch(err => res.json(err));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        profile.education.remove({ _id: req.params.edu_id });
        console.log('successfully deleted the education'); //MUST REMOVE **

        profile
          .save()
          .then(profile => res.json(profile.education))
          .catch(err => res.json(err));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() =>
        res.json({ success: true })
      );
    });
  }
);

module.exports = router;
