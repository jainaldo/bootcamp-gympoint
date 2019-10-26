import * as Yup from 'yup';
import { addMonths, parseISO, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Queue from '../../lib/Queue';
import EnrollmentMail from '../jobs/EnrollmentMail';

class EnrollmentController {
  async index(req, res) {
    const enrollments = await Enrollment.findAll({
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title'],
        },
      ],
    });
    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .integer()
        .positive()
        .required(),
      plan_id: Yup.number()
        .integer()
        .positive()
        .required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    // verificar se já tem uma matricula
    const enrollmentExists = await Enrollment.findOne({
      where: { student_id, plan_id },
    });

    if (enrollmentExists) {
      return res.status(400).json({ error: 'Enrollment already exists' });
    }

    // verificar se o aluno existe
    const studentExists = await Student.findOne({ where: { id: student_id } });

    if (!studentExists) {
      return res.status(401).json({ error: 'Student does not exists' });
    }

    // verificar se o plano existe
    const planExists = await Plan.findOne({ where: { id: plan_id } });
    if (!planExists) {
      return res.status(401).json({ error: 'Plan does not exists' });
    }

    const plan = await Plan.findByPk(plan_id);
    const student = await Student.findByPk(student_id);
    // calcular a data de termino e o preço
    const enrollment = await Enrollment.create({
      plan_id,
      student_id,
      start_date,
      end_date: addMonths(parseISO(start_date), plan.duration),
      price: plan.price * plan.duration,
    });

    await Queue.add(EnrollmentMail.key, {
      enrollment,
      plan,
      student,
    });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .positive()
        .integer(),
      plan_id: Yup.number()
        .positive()
        .integer(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fails' });
    }

    const { plan_id, student_id, start_date } = req.body;

    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) {
      return res.status(401).json({ error: 'Enrollment does not exists' });
    }

    if (plan_id !== enrollment.plan_id) {
      const planExists = await Plan.findOne({
        where: { id: plan_id },
      });

      if (!planExists) {
        return res.status(401).json({ error: 'Plan does not exists' });
      }
    }

    if (student_id !== enrollment.student_id) {
      const studentExists = await Student.findOne({
        where: { id: student_id },
      });

      if (!studentExists) {
        return res.status(401).json({ error: 'Student does not exists' });
      }
    }

    const plan = await Plan.findByPk(plan_id);
    const student = await Student.findByPk(student_id);

    const { id, price, end_date } = await enrollment.update({
      plan_id,
      student_id,
      start_date,
      end_date: addMonths(parseISO(start_date), plan.duration),
      price: plan.price * plan.duration,
    });

    await Queue.add(EnrollmentMail.key, {
      enrollment,
      plan,
      student,
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });
  }

  async delete(req, res) {
    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) {
      res.status(401).json({ error: 'Enrollment does not exists' });
    }

    await enrollment.destroy();

    return res.json({});
  }
}

export default new EnrollmentController();
