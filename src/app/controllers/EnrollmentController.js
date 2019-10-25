import * as Yup from 'yup';
import { addMonths, parseISO, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Mail from '../../lib/Mail';

class EnrollmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
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
      res.status(400).json({ error: 'Enrollment already exists' });
    }

    // verificar se o aluno existe
    const studentExists = await Student.findOne({ where: { id: student_id } });

    if (!studentExists) {
      res.status(401).json({ error: 'Student does not exists' });
    }

    // verificar se o plano existe
    const planExists = await Plan.findOne({ where: { id: plan_id } });
    if (!planExists) {
      res.status(401).json({ error: 'Plan does not exists' });
    }

    // calcular a data de termino e o preço
    const end_date = addMonths(parseISO(start_date), planExists.duration);

    const enrollment = await Enrollment.create({
      plan_id,
      student_id,
      start_date,
      end_date,
      price: planExists.total,
    });

    await Mail.sendMail({
      to: `${studentExists.name} <${studentExists.email}>`,
      subject: 'Matrícula realizada',
      template: 'enrollments',
      context: {
        student: studentExists.name,
        plan: planExists.title,
        end_date: format(enrollment.end_date, 'dd/MM/yyyy', { locale: pt }),
        total: `R$ ${enrollment.price}`,
      },
    });

    return res.json(enrollment);
  }
}

export default new EnrollmentController();
