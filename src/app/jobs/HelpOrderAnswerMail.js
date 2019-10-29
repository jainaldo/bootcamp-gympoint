import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import Mail from '../../lib/Mail';

class HelpOrderAnswerMail {
  get key() {
    return 'HelpOrderAnswerMail';
  }

  async handle({ data }) {
    const { helpOrder } = data;
    await Mail.sendMail({
      to: `${helpOrder.student.name} <${helpOrder.student.email}>`,
      subject: 'Seu pedido de auxílio foi respondido',
      template: 'helpOrderAnswer',
      context: {
        student: helpOrder.student.name,
        question: helpOrder.question,
        answer: helpOrder.answer,
        answer_at: format(parseISO(helpOrder.answer_at), 'dd/MM/yyyy', {
          locale: pt,
        }),
      },
    });
  }
}

export default new HelpOrderAnswerMail();
