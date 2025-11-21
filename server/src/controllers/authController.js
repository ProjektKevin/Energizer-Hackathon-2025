import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from '../services/supabaseClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Register new user
export const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      age, 
      gender, 
      height_cm, 
      weight_kg,
      weight_goal,
      conditions,
      allergies,
      goals 
    } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        name,
        age,
        gender,
        height_cm,
        weight_kg,
        weight_goal,
        calorie_goal: goals?.calories || 2000,
        carbs_goal: goals?.carbs || 250,
        protein_goal: goals?.protein || 50,
        fat_goal: goals?.fat || 65,
        sugar_goal: goals?.sugar || 50,
        sodium_goal: goals?.sodium || 2300
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Insert conditions
    if (conditions && conditions.length > 0) {
      const conditionRows = conditions.map(condition => ({
        user_id: newUser.user_id,
        condition_name: condition
      }));

      const { error: conditionError } = await supabase
        .from('user_conditions')
        .insert(conditionRows);

      if (conditionError) {
        console.error('Condition insert error:', conditionError);
      }
    }

    // Insert allergies
    if (allergies && allergies.length > 0) {
      const allergyRows = allergies.map(allergy => ({
        user_id: newUser.user_id,
        allergy_name: allergy
      }));

      const { error: allergyError } = await supabase
        .from('user_allergies')
        .insert(allergyRows);

      if (allergyError) {
        console.error('Allergy insert error:', allergyError);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Verify token / get current user
export const me = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, email, name')
      .eq('user_id', req.user.user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};