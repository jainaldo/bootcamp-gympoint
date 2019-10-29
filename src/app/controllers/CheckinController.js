import { differenceInDays } from 'date-fns';
import Student from '../models/Student';
import Checkin from '../models/Checkin';

class CheckinController {
  async store(req, res) {
    const studentExists = await Student.findByPk(req.params.id);
    if (!studentExists) {
      return res.status(401).json({ error: 'Student does not exist' });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.id,
      },
    });

    const lastCheckins = checkins.filter(checkin => {
      const differenceDays = differenceInDays(checkin.createdAt, new Date());
      if (differenceDays >= -7) {
        return checkin;
      }
    });

    if (lastCheckins.length >= 5) {
      return res.status(401).json({
        error: `You had ${lastCheckins.length} checkins on last 7 days`,
      });
    }

    const { student_id, createdAt } = await Checkin.create({
      student_id: req.params.id,
    });

    return res.json({
      student_id,
      createdAt,
    });
  }

  async index(req, res) {
    const studentExists = await Student.findByPk(req.params.id);

    if (!studentExists) {
      return res.status(401).json({ error: 'Student does not exist' });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.id,
      },
      attributes: ['id', 'student_id', 'createdAt'],
    });

    return res.json(checkins);
  }
}

export default new CheckinController();
